// *****************************
// ***** TREE OPTIONS HERE *****
// *****************************

// font size
var fontSize = 14;
// non-terminals
var nontermColor = "royalblue"; 
var nontermFont = `${fontSize}pt Times New Roman, serif`; 
// terminals
var termColor = "purple";
var termFont = `${fontSize}pt Comic Sans MS, sans-serif`;
// background
var treeBackground = "#fcfad1";
// vertical and horizontal space between nodes
var vertSpace = 50;
var horSpace = 30; 
// do you want colorful trees?
const color = true;
// do you want lines before terminal nodes?
const termLines = false;

// *****************************

async function loadNotes(filepath) {
    console. log(`Loading notes from ${filepath}`);

    const res = await fetch(`${filepath}`);
    const text = await res.text();
    const html = parseNotes(processFootnotes(text));
    document.getElementById("content").innerHTML = html;
}

function processFootnotes(inputText) {
    console.log("Processing footnotes...");

    let footnotes = [];
    let counter = 1;

    // \f[footnote text]
    let outputText = inputText.replace(/\\f\[(.*?)\]/g, 
            (_, footnoteText) => {
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
    let footnoteHTML = `<hr>\n<ol class="square-brackets" id="footnotes">\n`;
    for (const note of footnotes) {
        footnoteHTML += `  <li id="fn${note.id}">[${note.id}] ${note.text} 
        <a href="#fnref${note.id}">↩</a></li>\n`;
    }
    footnoteHTML += `</ol>`;

    return outputText + '\n\n' + footnoteHTML;
}

function parseNotes(text) {
    console.log("Parsing notes...");
    var num_trees = 0; 

    let html = text

    // Headings and Stuff
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // h1
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // h2
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>') // h4
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>') // h5
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>') // h6

    // Hidden Comments
    .replace(/^\s*\%.*$/gim, '') // % remove comments

    // Basic Formatting
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/gim, '<em>$1</em>') // *italics*
        // note: this supports ***bold italics*** as well
    .replace(/\~\~(.*?)\~\~/gim, '<del>$1</del>') // ~~strikethrough~~
    .replace(/\_(.*?)\_/gim, '<u>$1</u>') // _underline_
    .replace(/\&(.*?)\&/gim, '<code>$1</code>') // &inline code&

    // Block Types
    .replace(/^\s*\|\s?(.*)\r?$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\c([\s\S]*?)\c/gim, '<pre><code>$1</code></pre>') // \c code block

    // Annotations
    .replace(/&\[(.+?)\]\((.+?)\)/gim, // &[seen text](hover text)
        '<span class="comment" title="$2">$1</span>')

    // Links, Images, and In-Text Citations
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1">') // ![alt text](image url)
    .replace(/c\[(.*?)\]\((.*?)\)/gim, '<a class="citation" href="$2">$1</a>') // c[citationText](linkToZoteroPage)
        // links need to come last
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

    // TREES
    // everything between one \t and the next \t
    // can have line breaks and tabs
    // movement from [NP^ something<a>] to [TP_a something]
    //
    // EXAMPLE INPUT:
    // \t [S [NP This] [VP [V is] [^NP a wug]]] \t
    .replace(/\s*\\t\s*([\s\S]*?)\s*\\t/g, (match, content) => {

        // clean tree text
        const cleaned = content
            .replace(/[\n\r\t]/g, ' ') // replace newlines and tabs with a single space
            .replace(/\s+/g, ' ') // replace multiple spaces with a single space
            .trim(); // remove leading/trailing whitespace (prob not necessary?)

        // unique wrapper and id for each tree
        const idx = num_trees;
        const container = document.createElement('div');
        container.style.textAlign = "center";
        container.style.margin = "1em 0";
        container.id = `tree${idx}`;

        // generate svg tree
        const went = go(cleaned, fontSize, termFont, nontermFont, vertSpace, horSpace, color, termLines);
        const svgMarkup = new XMLSerializer().serializeToString(went);
        num_trees++;
        return svgMarkup; 
    })
    
    // LISTS (SANDWICH!)
    .replace(/^\s*\-\-\s/gim, '<ul><li>') // -- start of unordered list
    .replace(/^\s*1.\s/gim, '<ul><li>') // 1. start of ordered list
    .replace(/^\s*\-\s/gim, '</li><li>') // - next list item
    .replace(/^\s*\-\-u/gim, '</li></ul>') // --u end of unordered list
    .replace(/^\s*\-\-o/gim, '</li></ul>') // --o end of ordered list

    // Breaks and Rules (this has to come mostly last)
    .replace(/^\s*\-\-\-\-(.*)$/gim, '<hr>') // --- horizontal rule
    .replace(/^\n/gim, '<br>'); // \n newline

    // Numbered Examples
    let exampleCount = 0;
    html = html.replace(/\\e([\s\S]*?)\\z/gim, (match, exampleContent) => {
        exampleCount++;
        return `<div class="example">
        ${exampleCount}. ${exampleContent}</div>`;
    });

  return html;
}