async function loadNotes(filepath) {
  const res = await fetch(`${filepath}`);
  const text = await res.text();
  const html = parseNotes(processFootnotes(text));
  document.getElementById("content").innerHTML = html;
}

function processFootnotes(inputText) {
  let footnotes = [];
  let counter = 1;

  // \f[footnote text]
  let outputText = inputText.replace(/\\f\[(.*?)\]/g, (_, footnoteText) => {
    const footnoteId = counter;
    footnotes.push({
      id: footnoteId,
      text: footnoteText,
    });
    const sup = `<sup id="fnref${footnoteId}">
    <a href="#fn${footnoteId}">[${footnoteId}]</a></sup>`;
    counter++;
    return sup;
  });

  // Footnotes at the end
  let footnoteHTML = `<hr>\n<ol id="footnotes">\n`;
  for (const note of footnotes) {
    footnoteHTML += `  <li id="fn${note.id}">[${note.id}] ${note.text} <a href="#fnref${note.id}">↩</a></li>\n`;
  }
  footnoteHTML += `</ol>`;

  return outputText + '\n\n' + footnoteHTML;
}

function parseNotes(text) {
  let html = text

    // Headings and Stuff
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // h1
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // h2
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>') // h4
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>') // h5
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>') // h6

    // Breaks and Rules
    .replace(/^\n/gim, '<br>') // newline
    .replace(/^\-\-\-(.*)$/gim, '<hr>') // horizontal rule

    // Hidden Comments
    .replace(/^%.*$/gim, '') // remove comments (beginning with %)

    // Basic Formatting
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/gim, '<em>$1</em>') // *italics*
        // note: this should support ***bold italics*** as well
    .replace(/~~(.*?)~~/gim, '<del>$1</del>') // ~~strikethrough~~
    .replace(/_(.*?)_/gim, '<u>$1</u>') // _underline_
    .replace(/&(.*?)&/gim, '<code>$1</code>') // &inline code&

    // Block Types
    .replace(/^\| (.*$)/gim, '<blockquote>$1</blockquote>') // | blockquote
    .replace(/^\\c([\s\S]*?)\\c/gim, '<pre><code>$1</code></pre>') // \c code block

    // Links, Images, and In-Text Citations
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1">') // ![alt text](image url)
    .replace(/c\[(.*?)\]\(.*?)\)/gim, '<a class="citation" href="$2">$1</a>') // c[citationText](linkToZoteroPage)
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>') // [linkText](url)

    // Details and Summary
    .replace(/^> (.*)$/gim, '<details><summary>$1</summary>') // > Summary \n
    .replace(/^>>$/gim, '</details>') // >> End of details
        // this will work recursively! here's an example:
            // > Summary
            // Details
            // > Nested Summary
            // Nested Details
            // >>(End of Nested Details)
            // >>(End of Top-Level Details)    

    // Comments / Annotations
    .replace(/&\[(.+?)\]\((.+?)\)/gim, 
        '<span class="comment" title="$2">$1</span>')

        // TODO: make comments look nice, not just title attributes
        // make them stay on click and disappear on click?

    // syntax trees

    // LISTS

    // group consecutive lines starting with '- ' into <li>s in a <ul>
    .replace(/((?:^\- .*(?:\n|$))+)/gim, match => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^\- (.*)/, '$1');
        return `<li>${item}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    })
    // group consecutive lines starting with '1. ', '2. ', etc. or '1) ', '2) ', etc.
    // into <li>s in a <ol>
    .replace(/((?:^(?:\d+\.\s|\d+\)\s).*(?:\n|$))+)/gim, match => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^(?:\d+\.\s|\d+\)\s)(.*)/, '$1');
        return `<li>${item}</li>`;
      }).join('');
      return `<ol>${items}</ol>`;
    });

    // Numbered Examples
    let exampleCount = 0;
    html = html.replace(/\\e([\s\S]*?)\\z/gim, (match, exampleContent) => {
        exampleCount++;
        return `<div class="example">
        ${exampleCount}. ${exampleContent}</div>`;
    });

    // TODO: make numbered examples referenceable in text so that:
        // a) referencing an example links to it
        // and b) the reference number changes if the example order changes 

  return html;
}