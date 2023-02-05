
//https://www.webtips.dev/how-to-make-interactive-bubble-charts-in-d3-js

var sortedPop=[];
var sortedWW=[];

var svg = d3.select("#bubble"),
	width = 700,
	height = 700;

var format = d3.format(",d");

var color = d3.scaleOrdinal()//(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00","#6C7703", "#C2D702"]);
  .domain(["axis", "allies","none"])
  .range(["#C46B68","#906FA4","#AECFDE"]);
  
var pack = d3.pack()
	.size([width, height])
	.padding(1.5);

//Read the second dataset that contains population:
d3.csv("Datasets/wikipop.csv",
function (error, csv) {
	  if (error) throw error;
	  csv.forEach(function(d){ d['Population'] = +d['Population']; });    //numbers
	  //console.log(csv);   //ok
	  var sortedPop=csv.slice().sort((a, b) => d3.ascending(a.Country, b.Country));
	  console.log("Population dataset length",sortedPop.length);

	 d3.csv("Datasets/WW2 Casualties - Incidents.csv", function(d) {d.DeathsFinal = +d.DeathsFinal; if (d.DeathsFinal) return d;},
	 function(error, classes) {
		  if (error) throw error;
		  //console.log(classes); ok		
		  d3.csv("Datasets/powerslocation.csv",
		  function(error, pow) {
			      if (error) throw error;
				  //var sortedWW= classes.reduce(function (accumulator, DeathsFinal) {
					//return accumulator + classes.DeathsFinal;}, 0);
				  
				  //Sort the whole Dataset by CountryName in order to merge same country's deaths; then merge em:
				  var sortedWW=classes.slice().sort((a, b) => d3.ascending(a.Nationality, b.Nationality));
				  var prevcountry=sortedWW[0].Nationality;
				  var thisDeathsFinal=0;
				  var ProcessedClasses = [];
				  sortedWW.forEach(function(row){
						if (prevcountry!=row.Nationality){
							ProcessedClasses.push({Nationality: ""+prevcountry+"" , DeathsFinal: thisDeathsFinal});
							thisDeathsFinal=0;}
						thisDeathsFinal=thisDeathsFinal+row.DeathsFinal;
						prevcountry=row.Nationality;});
				  ProcessedClasses.push({Nationality: ""+prevcountry+"" , DeathsFinal: thisDeathsFinal});
				  console.log("Merged clean WWII dataset length",ProcessedClasses.length);

				   
				 //one is now sortedPop, another is ProcessedClasses.Join:
				  var ProcPopClasses=[];
				  for (let i = 0; i < ProcessedClasses.length; i++)
						{
						ProcPopClasses.push({Nationality: ""+ProcessedClasses[i].Nationality+"" ,
						DeathsFinal: ProcessedClasses[i].DeathsFinal,
						DeathonPop: (ProcessedClasses[i].DeathsFinal/sortedPop[i+1].Population)});
						}
				  console.log("The result after join of 2 datasets",ProcPopClasses);
				  

				var countrylst=[]
				pow.forEach(function(d){countrylst.push(d.Country)});
				console.log(countrylst);
				//BUBBLE:
				  var root = d3.hierarchy({children: ProcPopClasses})
					  .sum(function(d) { return d.DeathonPop; })
					  .each(function(d) {
						if (Nationality = d.data.Nationality) {
						  var Nationality, i = Nationality.lastIndexOf(".");
						  d.Nationality = Nationality;
						  						  console.log(pow[countrylst.indexOf(Nationality)].Power);
						  d.package = pow[countrylst.indexOf(Nationality)].Power;

						  d.class = Nationality.slice(i + 1);
						}
					  });

				  var node = svg.selectAll(".node")
					.data(pack(root).leaves())
					.enter().append("g")
					  .attr("class", "node")
					  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

				  node.append("circle")
					  .attr("Nationality", function(d) { return d.Nationality; })
					  .attr("r", function(d) { return d.r; })
					  .style("fill", function(d) { return color(d.package); });

				  node.append("clipPath")
					  .attr("Nationality", function(d) { return "clip-" + d.Nationality; })
					.append("use")
					  .attr("xlink:href", function(d) { return "#" + d.Nationality; });

				  node.append("text")
					  .attr("clip-path", function(d) { return "url(#clip-" + d.Nationality + ")"; })
					.selectAll("tspan")
					.data(function(d) {
						caption=d.class;
						abr=caption.replace(/[^A-Z]/g, '');
						if(d.data.DeathonPop<0.03){
							if (/\s/.test(caption)) {caption=abr} else if (caption.length>5) {caption=caption.substring(0,3);}}
						if(d.data.DeathonPop<0.001){caption="";}
						return caption.split(/(?=[A-Z][^A-Z])/g); })
					.enter().append("tspan")
					  .attr("x", 0)
					  .attr("y", function(d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10; })
					  .text(function(d) { return d; });

				  node.append("title")
					  .text(function(d) { /*console.log(d.Nationality)*/;return d.Nationality+ "\n With " + format(d.data.DeathsFinal) + " Casualty"; });
				});
		});
  });