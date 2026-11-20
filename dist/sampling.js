(function(root){
  'use strict';
  // Shared qualification rule for scores, their references and discipline.
  const api=Object.freeze({minimumScoreMinutes:200});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaSampling=api;
})(typeof window==='object'?window:globalThis);
