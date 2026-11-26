#!/usr/bin/env python3
"""Exploratory LaLiga Fantasy regressions, with team-held-out nested validation."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import numpy as np
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
LABELS = {'POR': 'Porteros', 'DEF': 'Centrales y defensas generales', 'DEF_FB': 'Laterales y carrileros', 'MED': 'Centrocampistas sin perfil estadístico', 'MED_DEF': 'Centrocampistas defensivos', 'MED_ATT': 'Centrocampistas ofensivos', 'MED_BALANCED': 'Centrocampistas equilibrados', 'DEL': 'Delanteros'}


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


def tune(x, y, groups):
    cv = GroupKFold(n_splits=min(3, len(set(groups))))
    search = GridSearchCV(make_pipeline(StandardScaler(), Ridge()), {'ridge__alpha': ALPHAS}, scoring='neg_mean_absolute_error', cv=cv, n_jobs=1, error_score='raise')
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
        estimator = tune(x[train], y[train], groups[train])
        predicted[test] = estimator.predict(x[test])
        baseline[test] = DummyRegressor().fit(x[train], y[train]).predict(x[test])
        minutes_model = tune(x[train, exposure_col:exposure_col+1], y[train], groups[train])
        exposure[test] = minutes_model.predict(x[test, exposure_col:exposure_col+1])
        fold_coefficients.append(estimator.best_estimator_['ridge'].coef_)
        folds.append({'fold': fold + 1, 'training': len(train), 'test': len(test), 'test_clubs': sorted(set(groups[test])), 'alpha': estimator.best_params_['ridge__alpha']})
    final = tune(x, y, groups)
    pipeline = final.best_estimator_
    coefficients = pipeline['ridge'].coef_
    scaler = pipeline['standardscaler']
    result.update(status='fitted', alpha=final.best_params_['ridge__alpha'], validation=metrics(y, predicted), baseline=metrics(y, baseline), minutes_only=metrics(y, exposure), training=metrics(y, pipeline.predict(x)), folds=folds, intercept=float(pipeline['ridge'].intercept_ - np.dot(coefficients / scaler.scale_, scaler.mean_)))
    z = scaler.transform(x)
    design = sm.add_constant(z, has_constant='add')
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
    for i, feature in enumerate(features):
        vif = float(variance_inflation_factor(design, i + 1)) if rank == design.shape[1] else None
        item = {'key': feature, 'label': labels[feature], 'control': feature == 'minutesExposure', 'ridge_standardized': float(coefficients[i]), 'ridge_raw': float(coefficients[i] / scaler.scale_[i]), 'sd': float(scaler.scale_[i]), 'mean': float(scaler.mean_[i]), 'sign_stability': float(np.mean(np.sign(np.array(fold_coefficients)[:, i]) == np.sign(coefficients[i]))), 'vif': vif if vif is not None and np.isfinite(vif) else None}
        if ols is not None:
            ci = ols.conf_int(alpha=0.05)[i + 1]
            item.update(ols_standardized=float(ols.params[i + 1]), ols_raw=float(ols.params[i + 1] / scaler.scale_[i]), ols_ci=[float(ci[0]), float(ci[1])], ols_p=float(ols.pvalues[i + 1]))
        result['coefficients'].append(item)
    result['players'] = [{'id': r['id'], 'name': r['name'], 'team': r['team'], 'points': r['points'], 'predicted_oof': float(predicted[i]), 'residual_oof': float(y[i] - predicted[i]), 'fantasy_minutes': r['fantasy_minutes']} for i, r in enumerate(rows)]
    result['warning'] = 'Asociaciones condicionadas al resto de variables y minutos; no causalidad. Los predictores correlacionados pueden repartirse el peso o cambiar de signo.'
    return result


def analyze(dataset):
    models = [fit_profile([r for r in dataset['records'] if r['profile'] == key], key) for key in LABELS]
    tested = [c for model in models for c in model['coefficients'] if 'ols_p' in c and np.isfinite(c['ols_p']) and not c['control']]
    if tested:
        q_values = multipletests([c['ols_p'] for c in tested], method='fdr_bh')[1]
        for item, q_value in zip(tested, q_values):
            item['ols_q'] = float(q_value)
    return {'metadata': {**dataset['metadata'], 'generated_at': datetime.now(timezone.utc).isoformat(), 'minimum_minutes': MINUTES, 'unclassified': sum(r['profile'] not in LABELS for r in dataset['records']), 'target': 'Puntos Fantasy acumulados', 'method': 'ridge_nested_group_cv_v1', 'validation': 'Five outer club-held-out folds; three inner club-held-out folds select alpha. Scaling fitted inside each training fold. Complete cases only, no imputation.', 'cohort': 'Feature minutes within max(5 min, 1%) of Fantasy and captures within 24 hours. PJ differences are diagnostic only: the fields are not proven equivalent. Approximate compatibility, not event-level reconciliation.', 'controls': 'Fantasy minutes; each player contributes one observation.', 'extra_sources': 'Published Fantasy yellowCard, redCard + secondYellowCard and penaltyWon counts per own 90 minutes; *Pts components excluded.', 'inference': 'OLS only when full rank and n >= max(30, 3*(p+1)); CR1 intervals clustered by club. Global Benjamini-Hochberg q values for tested non-control coefficients.'}, 'models': models, 'unmatched': dataset['unmatched']}


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
