#!/usr/bin/env python3
"""Exploratory LaLiga Fantasy regressions, with team-held-out nested validation."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
import statsmodels.api as sm
from statsmodels.stats.multitest import multipletests
from statsmodels.stats.outliers_influence import variance_inflation_factor

MINUTES = 200
MIN_ROWS = 20
ALPHAS = [0.1, 1, 10, 100, 1000]
EXTRAS = {'yellowCards': 'Amarillas /90 · Fantasy', 'redCards': 'Expulsiones /90 · directa + doble amarilla', 'penaltiesWon': 'Penaltis provocados /90 · Fantasy'}
LABELS = {'POR': 'Porteros', 'DEF': 'Centrales y defensas generales', 'DEF_FB': 'Laterales y carrileros', 'MED': 'Centrocampistas sin perfil estadístico', 'MED_DEF': 'Centrocampistas defensivos', 'MED_ATT': 'Centrocampistas ofensivos', 'DEL': 'Delanteros'}


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and np.isfinite(value)


def prepare(records, keys):
    rows, excluded = [], []
    for row in records:
        reasons = []
        if not finite(row['points']):
            reasons.append('puntos desconocidos')
        if not finite(row['fantasy_minutes']) or row['fantasy_minutes'] < MINUTES or not finite(row['minutes']) or row['minutes'] < MINUTES:
            reasons.append('menos de 200 minutos propios')
        values = []
        for key in keys:
            value, context = row['metrics'].get(key), row['contexts'].get(key, {})
            if not finite(value):
                reasons.append(key + ': dato desconocido')
            minutes = context.get('minutes')
            if not finite(minutes) or minutes < MINUTES:
                reasons.append(key + ': muestra propia insuficiente')
            if finite(minutes) and finite(row['fantasy_minutes']) and abs(minutes - row['fantasy_minutes']) > max(5, row['fantasy_minutes'] * 0.01):
                reasons.append(key + ': minutos desalineados')
            try:
                delta = abs((datetime.fromisoformat(context.get('captured_at', '').replace('Z', '+00:00')) - datetime.fromisoformat(row['fantasy_captured_at'].replace('Z', '+00:00'))).total_seconds())
                if delta > 86400:
                    reasons.append(key + ': captura desalineada')
            except (ValueError, TypeError):
                reasons.append(key + ': fecha desconocida')
            values.append(value)
        for key in EXTRAS:
            count = row['fantasy_counts'].get(key)
            if not finite(count) or count < 0:
                reasons.append(key + ': recuento desconocido')
            values.append(count / row['fantasy_minutes'] * 90 if finite(count) and finite(row['fantasy_minutes']) and row['fantasy_minutes'] > 0 else None)
        values.append(row['fantasy_minutes'])
        if reasons:
            excluded.append({'id': row['id'], 'name': row['name'], 'team': row['team'], 'reasons': sorted(set(reasons))})
        else:
            rows.append({**row, 'x': values})
    return rows, excluded


class CorrelationGroups(TransformerMixin, BaseEstimator):
    """Complete-link, sign-consistent Pearson groups learned on training rows only."""

    def __init__(self, threshold=0.8, control_indices=()):
        self.threshold = threshold
        self.control_indices = control_indices

    def fit(self, x, y=None):
        x = np.asarray(x)
        with np.errstate(divide='ignore', invalid='ignore'):
            correlation = np.corrcoef(x, rowvar=False) if x.shape[1] > 1 else np.ones((1, 1))
        self.correlation_ = np.nan_to_num(correlation)
        np.fill_diagonal(self.correlation_, 1)
        groups = [[i] for i in range(x.shape[1])]
        while True:
            candidates = []
            for i, left in enumerate(groups):
                for j in range(i + 1, len(groups)):
                    right = groups[j]
                    members = sorted(left + right)
                    if any(k in self.control_indices for k in members):
                        continue
                    strength = min(abs(self.correlation_[a, b]) for a in left for b in right)
                    signs = {k: 1 if self.correlation_[members[0], k] >= 0 else -1 for k in members}
                    consistent = all(signs[a] * signs[b] * self.correlation_[a, b] > 0 for a in members for b in members)
                    if strength >= self.threshold and consistent:
                        candidates.append((-strength, members, i, j))
            if not candidates:
                break
            _, members, i, j = min(candidates)
            groups = [g for k, g in enumerate(groups) if k not in (i, j)] + [members]
            groups.sort(key=lambda g: g[0])
        self.groups_ = groups
        self.weights_ = np.zeros((x.shape[1], len(groups)))
        for j, members in enumerate(groups):
            for i in members:
                self.weights_[i, j] = (1 if self.correlation_[members[0], i] >= 0 else -1) / len(members)
        return self

    def transform(self, x):
        return np.asarray(x) @ self.weights_

    def distribute(self, coefficients):
        return self.weights_ @ coefficients


def tune(x, y, groups, control_indices=()):
    cv = GroupKFold(n_splits=min(3, len(set(groups))))
    search = GridSearchCV(make_pipeline(StandardScaler(), CorrelationGroups(control_indices=control_indices), Ridge()), {'ridge__alpha': ALPHAS}, scoring='neg_mean_absolute_error', cv=cv, n_jobs=1, error_score='raise')
    return search.fit(x, y, groups=groups)


def metrics(y, prediction):
    return {'mae': float(mean_absolute_error(y, prediction)), 'rmse': float(np.sqrt(mean_squared_error(y, prediction))), 'r2': float(r2_score(y, prediction))}


def fit_profile(records, key):
    keys = list(dict.fromkeys(k for row in records for k in row['metrics']))
    labels = {k: next((r['contexts'][k]['label'] for r in records if k in r['contexts']), k) for k in keys}
    labels.update(EXTRAS)
    labels['minutesExposure'] = 'Minutos Fantasy · control de exposición'
    all_keys = keys + list(EXTRAS) + ['minutesExposure']
    rows, excluded = prepare(records, keys)
    result = {'key': key, 'label': LABELS[key], 'matched': len(records), 'n': len(rows), 'excluded': excluded, 'exclusion_counts': dict(Counter(reason for row in excluded for reason in row['reasons'])), 'status': 'insufficient_sample', 'coefficients': [], 'players': [], 'feature_labels': labels}
    if not rows:
        result['reason'] = 'No hay casos completos con muestras compatibles.'
        return result
    full = np.array([r['x'] for r in rows], dtype=float)
    varying = np.ptp(full, axis=0) > 1e-12
    result['constant_features'] = [all_keys[i] for i in np.flatnonzero(~varying)]
    features = [all_keys[i] for i in np.flatnonzero(varying)]
    x = full[:, varying]
    y = np.array([r['points'] for r in rows], dtype=float)
    groups = np.array([r['team'] for r in rows])
    result['clubs'] = len(set(groups))
    result['same_reported_matches'] = sum(r['matches'] == r['fantasy_matches'] for r in rows)
    result['max_minutes_gap'] = max(abs(r['minutes'] - r['fantasy_minutes']) for r in rows)
    result['parameters'] = len(features)
    if len(rows) < max(MIN_ROWS, len(features) + 6) or len(set(groups)) < 5 or 'minutesExposure' not in features:
        result['reason'] = 'Se requieren al menos 20 casos completos, seis más que variables, cinco equipos y variación de minutos.'
        return result
    outer = GroupKFold(n_splits=5)
    predicted, baseline, exposure = np.empty(len(y)), np.empty(len(y)), np.empty(len(y))
    folds, fold_coefficients = [], []
    exposure_col = features.index('minutesExposure')
    for fold, (train, test) in enumerate(outer.split(x, y, groups)):
        estimator = tune(x[train], y[train], groups[train], (exposure_col,))
        predicted[test] = estimator.predict(x[test])
        baseline[test] = DummyRegressor().fit(x[train], y[train]).predict(x[test])
        minutes_model = tune(x[train, exposure_col:exposure_col+1], y[train], groups[train], (0,))
        exposure[test] = minutes_model.predict(x[test, exposure_col:exposure_col+1])
        fold_pipeline = estimator.best_estimator_
        fold_coefficients.append(fold_pipeline['correlationgroups'].distribute(fold_pipeline['ridge'].coef_))
        folds.append({'fold': fold + 1, 'training': len(train), 'test': len(test), 'test_clubs': sorted(set(groups[test])), 'alpha': estimator.best_params_['ridge__alpha'], 'groups': [[features[i] for i in g] for g in fold_pipeline['correlationgroups'].groups_]})
    final = tune(x, y, groups, (exposure_col,))
    pipeline = final.best_estimator_
    grouper = pipeline['correlationgroups']
    group_coefficients = pipeline['ridge'].coef_
    coefficients = grouper.distribute(group_coefficients)
    scaler = pipeline['standardscaler']
    result.update(status='fitted', alpha=final.best_params_['ridge__alpha'], validation=metrics(y, predicted), baseline=metrics(y, baseline), minutes_only=metrics(y, exposure), training=metrics(y, pipeline.predict(x)), folds=folds, intercept=float(pipeline['ridge'].intercept_ - np.dot(coefficients / scaler.scale_, scaler.mean_)))
    z = scaler.transform(x)
    grouped = grouper.transform(z)
    design = sm.add_constant(grouped, has_constant='add')
    result['correlation'] = {'method': 'Pearson', 'threshold': 0.8, 'features': features, 'matrix': grouper.correlation_.tolist(), 'minutes_grouped': False}
    result['groups'] = []
    result['group_parameters'] = len(grouper.groups_)
    rank = np.linalg.matrix_rank(design)
    result['condition_number'] = float(np.linalg.cond(design)) if rank == design.shape[1] else None
    result['ols_status'] = 'insufficient_sample'
    ols = None
    if rank == design.shape[1] and len(rows) >= max(30, 3 * design.shape[1]) and len(set(groups)) >= 8:
        ols = sm.OLS(y, design).fit(cov_type='cluster', cov_kwds={'groups': groups, 'use_correction': True}, use_t=True)
        result['ols_status'] = 'estimated'
        result['ols_method'] = 'OLS; CR1 cluster covariance by club; t with club-count minus one degrees of freedom'
    elif rank < design.shape[1]:
        result['ols_status'] = 'rank_deficient'
    for j, members in enumerate(grouper.groups_):
        vif = float(variance_inflation_factor(design, j + 1)) if rank == design.shape[1] else None
        item = {'id': 'G' + str(j + 1), 'members': [features[i] for i in members], 'signs': [int(np.sign(grouper.weights_[i, j])) for i in members], 'size': len(members), 'control': exposure_col in members, 'ridge': float(group_coefficients[j]), 'min_abs_correlation': min((abs(grouper.correlation_[a, b]) for a in members for b in members if a != b), default=1.0), 'vif': vif if vif is not None and np.isfinite(vif) else None}
        if ols is not None:
            item.update(ols=float(ols.params[j + 1]), ols_ci=[float(v) for v in ols.conf_int(alpha=0.05)[j + 1]], ols_p=float(ols.pvalues[j + 1]))
        result['groups'].append(item)
        for i in members:
            feature = features[i]
            weight = float(grouper.weights_[i, j])
            coefficient = {'key': feature, 'label': labels[feature], 'control': feature == 'minutesExposure', 'kind': 'control' if feature == 'minutesExposure' else 'extra' if feature in EXTRAS else 'axis', 'group': item['id'], 'group_size': len(members), 'group_weight': weight, 'ridge_standardized': float(coefficients[i]), 'ridge_raw': float(coefficients[i] / scaler.scale_[i]), 'sd': float(scaler.scale_[i]), 'mean': float(scaler.mean_[i]), 'sign_stability': float(np.mean(np.sign(np.array(fold_coefficients)[:, i]) == np.sign(coefficients[i]))), 'vif': item['vif']}
            if ols is not None:
                coefficient.update(ols_standardized=item['ols'] * weight, ols_raw=item['ols'] * weight / float(scaler.scale_[i]), ols_ci=sorted(v * weight for v in item['ols_ci']), ols_p=item['ols_p'])
            result['coefficients'].append(coefficient)
    # Positive axis associations suggest a within-profile allocation, never automatic weights.
    total = sum(max(c['ridge_standardized'], 0) for c in result['coefficients'] if c['kind'] == 'axis')
    for c in result['coefficients']:
        c['suggested_axis_share'] = max(c['ridge_standardized'], 0) / total if c['kind'] == 'axis' and total > 0 else None
    result['coefficients'].sort(key=lambda c: features.index(c['key']))
    result['players'] = [{'id': r['id'], 'name': r['name'], 'team': r['team'], 'points': r['points'], 'predicted_oof': float(predicted[i]), 'residual_oof': float(y[i] - predicted[i]), 'fantasy_minutes': r['fantasy_minutes']} for i, r in enumerate(rows)]
    result['warning'] = 'Asociaciones con puntos Fantasy, no efecto causal ni regresión del score actual. Los grupos se aprenden dentro de cada entrenamiento; su coeficiente se reparte por igual con orientación de signo. Ese reparto conserva la predicción, pero no identifica efectos individuales. Pesos orientativos por perfil: solo asociaciones positivas de ejes, sin minutos ni extras; nunca se aplican automáticamente.'
    return result


def analyze(dataset):
    models = [fit_profile([r for r in dataset['records'] if r['profile'] == key], key) for key in LABELS]
    tested = [g for model in models for g in model.get('groups', []) if 'ols_p' in g and np.isfinite(g['ols_p']) and not g['control']]
    if tested:
        q_values = multipletests([g['ols_p'] for g in tested], method='fdr_bh')[1]
        for item, q_value in zip(tested, q_values):
            item['ols_q'] = float(q_value)
        for model in models:
            by_group = {g['id']: g for g in model.get('groups', [])}
            for c in model['coefficients']:
                if 'ols_q' in by_group[c['group']]:
                    c['ols_q'] = by_group[c['group']]['ols_q']
    return {'metadata': {**dataset['metadata'], 'generated_at': datetime.now(timezone.utc).isoformat(), 'minimum_minutes': MINUTES, 'unclassified': sum(r['profile'] not in LABELS for r in dataset['records']), 'target': 'Puntos Fantasy acumulados', 'method': 'ridge_correlated_group_cv_v2', 'validation': 'Five outer club-held-out folds; three inner club-held-out folds select alpha. Scaling and complete-link sign-consistent Pearson |r| >= 0.80 grouping fitted inside each training fold; minutes never grouped. Complete cases only, no imputation.', 'cohort': 'Feature minutes within max(5 min, 1%) of Fantasy and captures within 24 hours. PJ differences are diagnostic only: the fields are not proven equivalent. Approximate compatibility, not event-level reconciliation.', 'controls': 'Fantasy minutes; each player contributes one observation.', 'weight_purpose': 'Separate model per canonical profile. Positive standardized axis contributions normalized within profile suggest candidate score weights; minutes and extras excluded. Negative axes require review, not automatic inversion. No current score change. Groups do not identify separate causal effects.', 'group_formula': 'G = mean(s_i * Z_i); beta_i = s_i * beta_G / k; raw beta_i = beta_i / SD_i. Equal signed split conserves predictions.', 'extra_sources': 'Published Fantasy yellowCard, redCard + secondYellowCard and penaltyWon counts per own 90 minutes; *Pts components excluded.', 'inference': 'OLS only when full rank and n >= max(30, 3*(p+1)); CR1 intervals clustered by club. Global Benjamini-Hochberg q values once per tested non-control group, not duplicated per member.'}, 'models': models, 'unmatched': dataset['unmatched']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    body = args.input.read_bytes()
    dataset = json.loads(body)
    result = analyze(dataset)
    result['metadata']['joined_sha256'] = hashlib.sha256(body).hexdigest()
    args.output.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    print(json.dumps({'matched': dataset['metadata']['matched'], 'models': [{'profile': m['key'], 'n': m['n'], 'status': m['status'], 'cv': m.get('validation'), 'ols': m.get('ols_status')} for m in result['models']]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
