(function(root){
 'use strict';
 const metrics=typeof module==='object'&&module.exports?require('./metrics.js'):root.GradaMetrics;
 const maximumPenalty=0.10,redWeight=4;
 function evaluate(record,minimumMinutes=record.pos==='POR'?180:450){
  const yellow=record.yellowCards,red=record.redCards,a=metrics.context(record,'yellowCards'),b=metrics.context(record,'redCards');
  const result={status:'unavailable',factor:null,penaltyFraction:null,yellowCards:Number.isInteger(yellow)&&yellow>=0?yellow:null,redCards:Number.isInteger(red)&&red>=0?red:null,weightedCardsPer90:null,source:null,minutes:null,matches:null,contexts:null};
  if(result.yellowCards===null||result.redCards===null)return result;
  if(!metrics.sameSample(a,b))return {...result,status:'incompatible_sample'};
  const context={source:a.source,minutes:a.minutes,matches:a.matches,contexts:{yellowCards:a,redCards:b}};
  if(!Number.isFinite(minimumMinutes)||minimumMinutes<0||!Number.isFinite(a.minutes)||a.minutes<=0||a.minutes<minimumMinutes)return {...result,...context,status:'insufficient_sample'};
  // Divide first to avoid overflow for invalid/extreme counts. No foreign minutes.
  const intensity=yellow/a.minutes*90+red/a.minutes*90*redWeight;
  if(!Number.isFinite(intensity))return {...result,...context,status:'invalid_rate'};
  const penaltyFraction=maximumPenalty*(intensity/(1+intensity));
  return {...result,...context,status:'verified',weightedCardsPer90:intensity,penaltyFraction,factor:1-penaltyFraction};
 }
 function apply(record,profile){
  const fairPlay=evaluate(record,profile.minimumMinutes),baseScore=profile.score,score=Number.isFinite(baseScore)&&fairPlay.factor!==null?baseScore*fairPlay.factor:baseScore;
  return {...profile,baseScore,score,comparableArea:score,fairPlay:{...fairPlay,scoreDeduction:Number.isFinite(baseScore)&&fairPlay.factor!==null?baseScore-score:null}};
 }
 const api={evaluate,apply,maximumPenalty,redWeight};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaFairPlay=api;
})(typeof window==='object'?window:globalThis);
