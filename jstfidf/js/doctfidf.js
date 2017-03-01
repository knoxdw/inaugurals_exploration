var tv = {
  current : '1841'
};

d3.queue()
  .defer(d3.tsv, "data/termcounts.csv", 
         d =>                // row accessor function 
            _.fromPairs(     // to parse counts as integers
             _.map(d, (v, k) => 
                   [k, k==='token' ? v : +v]))
         )
  .defer(d3.tsv, "data/yearname.csv")  // doc - name mapping
  .defer(d3.tsv, "data/seq.csv")        // full token sequence
  .defer(d3.tsv, "data/df.csv")         // doc counts per token
  .await(start);

function start(error, termcountsarg, yearnamesarg, 
               seqarg,
               dfarg) {
  tv.termcounts = _.keyBy(termcountsarg, 'token');
  tv.year2name = _.fromPairs(
    _.zip(
      _.map(yearnamesarg, 'year'),
      _.map(yearnamesarg, 'name')));
  tv.seq = _.groupBy(seqarg, 'year');
  tv.df = _.fromPairs(
    _.zip(
      _.map(dfarg, 'token'),
      _.map(dfarg, 'df')));
  tv.docnames = _.filter(
    _.keys(termcountsarg[0]),
    d => d !== 'token');
  showdoclist(tv);
  setTimeout(t =>
             showfordoc('1841'), 100);
};

function filterfordoc(array, docname) {
  return _.fromPairs(
    _.map(
      _.filter(array, docname),
      v => [v.token, v[docname]]));
}


  function removetooltip() {
    var tooltip = d3.select("#tooltip");
    d3.selectAll("#tooltip text").remove();
    d3.selectAll("#wordlist div").remove();
  };
  
  function pluralize(term, count) {
    if (count === 1) {
      return term;
    } else {
      return term + "s";
    }
  };

  function showtooltip(spot, doctf){
    const localterms = spot.values;
    const count = spot.values[0].count;
    const tf = spot.values[0].tf;
    const df = spot.values[0].df;
    const idf = spot.values[0].idf;
    const tooltext1 = `${localterms.length} 
    ${pluralize('term',localterms.length)} 
    ${localterms.length===1 ?
      ' (' + localterms[0].lem + ')' : ''}
    `;
    const tooltext2 = `
      in ${localterms[0].df} ${pluralize('doc',localterms[0].df)},
      ${localterms[0].count}x in this doc
    `;
    const tooltip = d3.select("#tooltip");
    tooltip.selectAll("text").remove();
    tooltip.append("text")
      .attr("x", x(+count) + 10)
      .attr("y", y(+idf) - 5)
      .text(tooltext1);
    tooltip.append("text")
      .attr("x", x(+count) + 10)
      .attr("y", y(+idf) + 15)
      .text(tooltext2);

    tv.drawisoline(count * idf);

  }
  
  function showtermlist(spot, doctf) {
    const localterms = spot.values;
    var wordlist = d3.select("#wordlist")
        .selectAll("div")
        .data(localterms, d => d.lem);
    wordlist.exit().remove();
    wordlist
      .enter()
      .append("div")
      .merge(wordlist)
      .text(d => d.lem);
  }

function showfordoc(docname) {
  tv.current = docname;
  removetooltip();
  d3.selectAll("#doclist li").classed("selected", false);
  const selector = `li[title='${docname}']`;
  d3.select(selector).classed("selected", true);
  d3.select("#selectiontitle").text(docname + " " + tv.year2name[docname]);
  const docfilt = filterfordoc(tv.termcounts, docname);
  const doctotal = tv.seq[docname].length;
  const numdocs = tv.docnames.length;
  const doctf = _.map(_.keys(docfilt), function(k) {
    return {'lem': k,
            'count': +docfilt[k],
            'tf': (+docfilt[k])/doctotal, 
            'df': +tv.df[k],
            'idf': numdocs/(+tv.df[k] + 1)
           };
  });
  const grid = d3.nest()
        .key(d => d.df + "_" + d.tf) 
        .entries(doctf);
  const counts = doctf.map(d => +d.count);
  const tfs = doctf.map(d => +d.tf);
  const dfs = doctf.map(d => +d.df);
  const idfs = doctf.map(d => +d.idf);
  x = d3.scaleLog()
      .domain([1, _.max(counts)])
      .range([80, 780]);
  y = d3.scaleLog()
      .domain([0.1, _.max(idfs)+10])// [_.min(idfs), _.max(idfs)])
      .range([780, 20]);
  const svg = d3.select("#plot");
  const circles = svg.selectAll("circle")
      .data(grid);
  circles.exit()
    .remove();
  circles.enter()
    .append("circle")
    .merge(circles)
    .attr("cx", d => 
       +x(d.values[0].count)+ parseInt(4*Math.random()))
    .attr("cy", d =>
       +y(d.values[0].idf) + parseInt(7*Math.random()))
    .attr("data-count", d => d.values[0].length)
    .attr("label", d => d.values.length)
    .attr("r", d => Math.sqrt(d.values.length + 2) * 4);
  circles.on("mouseover", function(d) {
     showtooltip(d, doctf);
    showtermlist(d, doctf);

//     circles.on("click", function(d1) {
//       showtermlist(d1, doctf);
//     });
  });
  
  tv.drawisoline = function(value) {
    /* draw line for constant TFIDF value */
    const tfidfiso = value;
    const linetf = _.range(0.0001, 50, 0.01);
    const lineidf = _.map(linetf, d =>
       tfidfiso/d
    );
    const linex = _.map(linetf, x);
    const liney = _.map(lineidf, y);
    const linepairs = _.zip(linetf, lineidf);
    const linedata = _.map(linepairs, function(d) {
      return {'x': d[0], 'y':d[1]}});
    const linefunction = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y))
        .curve(d3.curveBasis);
    d3.selectAll("svg path").remove();
    svg.append("path")
      .attr("d", linefunction(linedata));
  }

//  tv.drawisoline(10.0);

  
  
};

function showdoclist(tv) {
  var doclist = d3.select("#doclist ul");
  doclist.selectAll("li")
    .data(tv.docnames)
    .enter()
    .append("li")
    .text(d => d)
    .attr("title", d => d);
  doclist.selectAll("li")
    .on("click", d =>  showfordoc(d));
  d3.select("body")
    .on("keydown", function(){
      const k = d3.event.keyCode;
      if (k === 39) {
        var ix = tv.docnames.indexOf(tv.current) + 1;
        ix = _.min([ix, tv.docnames.length - 1]);
        tv.current = tv.docnames[ix];
        showfordoc(tv.current);
      }
      if (k === 37) {
        var ix = tv.docnames.indexOf(tv.current) - 1;
        ix = _.max([ix, 0]);
        tv.current = tv.docnames[ix];
        showfordoc(tv.current);
      }
    });
};
