import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['dist/server/**','dist/downloads/**','node_modules/**']},
  js.configs.recommended,
  {files:['dist/app.js'],languageOptions:{globals:Object.fromEntries(['Branding','Radar','Leagues','Refresh','Dates','Fotmob','Squads','Metrics','Combined','Scopes','Scores','Explore','Clubs','Security','Positions','Roles','Nationality','Nations','Ideal','Owner','Filters','Profiles','Understat','LaLiga','Components','Competitions','Fantasy'].map(name=>['Grada'+name,'readonly']))}},
  {languageOptions:{ecmaVersion:2023,sourceType:'commonjs',globals:{...globals.browser,...globals.node}},rules:{'no-unused-vars':['warn',{args:'none',caughtErrors:'none'}],'no-useless-escape':'warn','no-empty':['error',{allowEmptyCatch:true}]}}
];
