let sortBy = require('lodash.sortby');

// makeTagProcessor is a helper function to roll your own tag processor function
// eg, if you wanted to URI-encode substitution values in a template string,
// you could do something like so:
// let enc = makeTagProcessor((index, literals, cookedValues) => literals[index] + encodeURIComponent(cookedValues[index] || ''));
// let xx = 'hi there';
// console.log(enc`<span>${xx}</span>`);
// <span>hi%20there</span>
// or, using the postProcessor option:
// let $enc = makeTagProcessor(
//     (index, literals, cookedValues) => literals[index] + encodeURIComponent(cookedValues[index] || ''),
//     (str) => Ember.$(str)
// );
// let xx = 'hi there';
// console.log($enc`<span>${xx}</span>`);
// [ <span>hi%20there</span> ]

function makeTagProcessor(tagFn) {
  tagFn = tagFn || defaultConcatenateTaggedString;
  return function(literals, ...cookedValues) {
    let out = '';
    for (let index = 0; index < literals.length; index++) {
      out += tagFn(index, literals, cookedValues);
    }
    return out;
  };
}

// similar to makeTagProcessor, makeBlockTagProcessor is a helper function to create tag processors that
// fix indentation (as in coffeescript block strings) http://coffeescript.org/#strings
// and also add additional processing options via the tagFn
function makeBlockTagProcessor(tagFn, postProcessor) {
  tagFn = tagFn || defaultConcatenateTaggedString;
  let _literals;
  return makeTagProcessor(function(index, literals, cookedValues) {
    if (index === 0) {
      // get the leading indents among the lines
      let joinedLiterals = literals.join('')
        .replace(/\n +$/g, ''); // indentation ignores whitespace-only line at end
      let indentation = joinedLiterals.match(/^ *(?=\S)|^ +$/gm); // match zero or more leading spaces in lines, but ignore completely empty lines
      if (indentation) {
        // get the shortest leading indent
        indentation = new RegExp(`^${sortBy(indentation, 'length')[0]}`, 'gm');
        // and replace that leading indent on each line
        // of both the raw and the parsed literals
        _literals = fixIndent(literals, indentation);
        _literals.raw = fixIndent(literals.raw, indentation);
      } else {
        _literals = literals;
      }
    }
    return tagFn(index, _literals, cookedValues);
  });
}

function fixIndent(array, indentation) {
  return array.map((text, ii) => {
    text = text.replace(indentation, '');
    if (ii === 0) {
      text = text.replace(/^\n/, '');
    }
    if (ii === array.length - 1) {
      text = text.replace(/\n *$/, '');
    }
    return text;
  });
}

// a tag function for treating template strings like coffeescript blockStrings, which are awesome
//  > Block strings can be used to hold formatted or indentation-sensitive text….
//  The shortest non-zero indentation level is maintained throughout,
//  > so you can keep it all aligned with the body of your code.
// for example, I can write blockString`
//                      something
//                      something
//                  `
// instead of `something
// something`
let blockString = makeBlockTagProcessor(defaultConcatenateTaggedString);

// this tag-processor helper function interleaves literals and cooked substitutions,
// just like the default template-string behavior
function defaultConcatenateTaggedString(index, literals, cookedValues) {
  if (index < cookedValues.length) {
    return literals[index] + cookedValues[index];
  } else {
    return literals[index];
  }
}

module.exports = blockString;
