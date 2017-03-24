"use strict";
const pattern = /\b(steps to reproduce|expected result|actual result|client setting|system setting)s?:?/i;

function getSections(command, sections) {
  sections = sections || {};

  let match = command.match(pattern);
  if(!match) {
    return sections;
  }
  let currentSection = match[1].toLowerCase();

  command = command.substring(match[0].length);
  let nextMatch = command.match(pattern);
  let sectionEnd = (nextMatch && nextMatch.index) || command.length;
  let sectionText = command.substring(0, sectionEnd);

  sections[currentSection] = sectionText.trim();
  command = command.substring(sectionEnd);

  return getSections(command, sections);
}

if(module) { module.exports = getSections; }
