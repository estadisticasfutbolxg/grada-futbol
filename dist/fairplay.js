(function(root){
  'use strict';
  const metrics=typeof module==='object'&&module.exports?require('./metrics.js'):root.GradaMetrics;
  // GRADA design parameters, not observed suspension lengths or causal estimates.
  const method='linear_cards_v2',yellowPenaltyPer90=0.10,redWeight=10,maximumPenalty=1;
  function evaluate(record,minimumMinutes=record.pos==='POR'?180:450){
    const yellow=record.yellowCards,red=record.redCards;
    const a=metrics.context(record,'yellowCards'),b=metrics.context(record,'redCards');
    const count=value=>Number.isSafeInteger(value)&&value>=0?value:null;
    const result={
      method,yellowPenaltyPer90,redWeight,status:'unavailable',factor:null,penaltyFraction:null,
      yellowCards:count(yellow),redCards:count(red),weightedCardsPer90:null,
      yellowCardsPer90:null,redCardsPer90:null,yellowPenaltyFraction:null,redPenaltyFraction:null,
      rawPenaltyFraction:null,source:null,minutes:null,matches:null,contexts:null
    };
    if(result.yellowCards===null||result.redCards===null)return result;
    if(!metrics.sameSample(a,b))return {...result,status:'incompatible_sample'};
    const context={source:a.source,minutes:a.minutes,matches:a.matches,contexts:{yellowCards:a,redCards:b}};
    if(!Number.isFinite(minimumMinutes)||minimumMinutes<0||!Number.isFinite(a.minutes)||a.minutes<=0||a.minutes<minimumMinutes){
      return {...result,...context,status:'insufficient_sample'};
    }
    const yellowCardsPer90=yellow/a.minutes*90,redCardsPer90=red/a.minutes*90;
    const intensity=yellowCardsPer90+redCardsPer90*redWeight;
    const yellowPenaltyFraction=yellowCardsPer90*yellowPenaltyPer90;
    const redPenaltyFraction=redCardsPer90*yellowPenaltyPer90*redWeight;
    const rawPenaltyFraction=yellowPenaltyFraction+redPenaltyFraction;
    if(![intensity,rawPenaltyFraction].every(Number.isFinite))return {...result,...context,status:'invalid_rate'};
    // Constant marginal penalty per card, until the score reaches its natural floor.
    const penaltyFraction=Math.min(maximumPenalty,rawPenaltyFraction);
    return {...result,...context,status:'verified',weightedCardsPer90:intensity,
      yellowCardsPer90,redCardsPer90,yellowPenaltyFraction,redPenaltyFraction,rawPenaltyFraction,
      penaltyFraction,factor:1-penaltyFraction};
  }
  function apply(record,profile){
    const fairPlay=evaluate(record,profile.minimumMinutes),baseScore=profile.score;
    const score=Number.isFinite(baseScore)&&fairPlay.factor!==null?baseScore*fairPlay.factor:baseScore;
    return {...profile,baseScore,score,comparableArea:score,fairPlay:{...fairPlay,
      scoreDeduction:Number.isFinite(baseScore)&&fairPlay.factor!==null?baseScore-score:null}};
  }
  const api={evaluate,apply,method,yellowPenaltyPer90,maximumPenalty,redWeight};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaFairPlay=api;
})(typeof window==='object'?window:globalThis);
