var CountryCiv = [];  
var CountryMil = [];
var Country = [];


//Read and Process Data//
d3.csv("Datasets/WW2 Casualties - Incidents.csv",
	function(d) {
			d.DeathsFinal = +d.DeathsFinal;
			d.CivilianRate = +d.CivilianRate;
			if (d.DeathsFinal) return d;},									
	function(error, classes) {
			if (error) throw error;
			var dataset= classes;

			var years=[39,40,41,42,43,44,45,46];
			var AllCiv=[];
			var AllMil=[];
			dataset.forEach(function(d,i) {
								var IntervalCiv=[0,0,0,0,0,0,0,0];
								var IntervalMil=[0,0,0,0,0,0,0,0];
								s=d.StartDate.slice(-2);
								e=d.EndDate.slice(-2);
								s=Number(s);
								e=Number(e);
								civrate=Number(d.CivilianRate);
								numbers=e-s+1
								for (let y=s;y<=e;y++){
									IntervalCiv[years.indexOf(y)]=(civrate*d.DeathsFinal)/numbers; //compute number of civilians
									IntervalMil[years.indexOf(y)]=((1-civrate)*d.DeathsFinal)/numbers;} //compute number of militarians
								AllCiv.push({Nat: ""+d.Nationality+"" , DeathByYear: IntervalCiv});
								AllMil.push({Nat: ""+d.Nationality+"" , DeathByYear: IntervalMil});
								});
			//console.log(AllCiv,AllMil);//ok 
			//console.log(AllCiv[4].DeathByYear[3]);


			//Sort for Reduce:::::
			//dataset.forEach (function (d,i) {console.log(i,d.Nationality,d.StartDate,d.EndDate,d.DeathsFinal, AllCiv[i],AllMil[i])});
			var sortedWWCiv=AllCiv.slice().sort((a, b) => d3.ascending(a.Nat, b.Nat));
			var sortedWWMil=AllMil.slice().sort((a, b) => d3.ascending(a.Nat, b.Nat));
			//console.log(sortedWWCiv); //ok Germany is the first entry with Civilian
			//both sortedWWCiv and sortedWWMil are Nat: "" , DeathByYear: # -- if error , reload DS
			
			
			
			//Reduce both:
			var prevcountry=sortedWWCiv[0].Nat;
			var tempciv=[];
			var tempmil=[];
			for (let row=0; row<sortedWWCiv.length; row++){
				if (prevcountry!=sortedWWCiv[row].Nat){
					CountryCiv.push(tempciv);
					CountryMil.push(tempmil);
					Country.push(prevcountry);
					//console.log("pushing ",prevcountry,tempciv,tempmil); 
					tempciv=[];
					tempmil=[];}
				tempciv=sumArray(tempciv,sortedWWCiv[row].DeathByYear);
				tempmil=sumArray(tempmil,sortedWWMil[row].DeathByYear);
				prevcountry=sortedWWCiv[row].Nat;};
			CountryCiv.push(tempciv);
			CountryMil.push(tempmil);
			Country.push(prevcountry);
			console.log("Merged clean Civ and Mil Death dataset with lengths ",CountryCiv.length,CountryMil.length);
			
			StackedBar("total");
	});//end of Process data
	

function sumArray(a, b) {
  var c = [];
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
	c.push((a[i] || 0) + (b[i] || 0));
  }
  return c;
}


	
	
	
function ChangeYear(v) {
	NewDraw=document.getElementById("chosenyear").value;
	console.log(NewDraw);
	StackedBar(NewDraw);
	//clearMap(); 	//clean the map first
}



	
function StackedBar(SpecYear){
	//transposing the data of the specified column, or sum all the columns:
	console.log(Country,CountryCiv,CountryMil);
	if (SpecYear=="total"){
		data=[];t=0;
		for (let i=0; i<Country.length; i++){
				data.push({country: Country[i],
						   civilian: Math.round(CountryCiv[i].reduce((a, b) => a + b, 0)),
						   military: Math.round(CountryMil[i].reduce((a, b) => a + b, 0))
				});		
					if (Math.round(CountryCiv[i].reduce((a, b) => a + b, 0)+CountryMil[i].reduce((a, b) => a + b, 0))   >t)
					{t=Math.round(CountryCiv[i].reduce((a, b) => a + b, 0)+CountryMil[i].reduce((a, b) => a + b, 0))};	
		};
	}
	else{
		var IndYear= d3.scaleLinear()
			.domain([39,46]).range([0,7]);
		year=IndYear(SpecYear);
				
		data=[];t=0;
		for (let i=0; i<Country.length; i++){
				data.push({country: Country[i],
						   civilian: Math.round(CountryCiv[i][year]),
						   military: Math.round(CountryMil[i][year])
						   //total: Math.round(CountryCiv[i][year]+CountryMil[i][year])
				});		
				console.log(year);
				if (Math.round(CountryCiv[i][year]+CountryMil[i][year])>t){t=Math.round(CountryCiv[i][year]+CountryMil[i][year])};	
		};
	}
	//console.log(data); //ok


	//Make the svg
	var svg = d3.select("#stacked"),
    margin = {top: 30, right: 90, bottom: 110, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
	var x = d3.scaleBand()
		.rangeRound([0, width])
		.padding(0.3)
		.align(0.3);

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	var z = d3.scaleOrdinal(["#6C7703", "#C2D702"]);

	var stack = d3.stack();

	data.sort((a, b) => d3.ascending(a.civilian+a.military, b.civilian+b.military)).reverse();
	console.log(data);
	data=data.splice(0,24);
	console.log(Object.keys(data[0])); //.column didn't work!
	console.log(data);
	x.domain(data.map(function(d) { return d.country; }));
	y.domain([0, t]).nice();
	z.domain(Object.keys(data[0]).slice(1));
	
	d3.selectAll(".serie").remove();

	g.selectAll(".serie")
		.data(stack.keys(Object.keys(data[0]).slice(1))(data))
		.enter().append("g")

		  .attr("class", "serie")
		  .attr("fill", function(d) { return z(d.key); })
		.selectAll("rect")
		  .data(function(d) { return d; })
		  .enter().append("rect")
		  .attr("x", function(d) { return x(d.data.country); })
		  .attr("y", function(d) { return y(d[1]); })
		  .attr("height", function(d) { return y(d[0]) - y(d[1]); })
		  .attr("width", x.bandwidth())
		  .on("mouseover", function() { tooltip.style("display", null); })
		  .on("mouseout", function() { tooltip.style("display", "none"); })
		  .on("mousemove", function(d) {
			var xPosition = d3.mouse(this)[0] - 5;
			var yPosition = d3.mouse(this)[1] - 25;
			tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
			tooltip.select("text").text(d[1] - d[0]);
		  });

	d3.selectAll(".ax").remove();

	  g.append("g")
		  .attr("class", "ax ax--x")
		  .attr("transform", "translate(0," + height + ")")
		  .call(d3.axisBottom(x))
		  .selectAll("text")
			.style("text-anchor","end")
			.attr("dx","-.8em")
			.attr("dy","-.15em")
			.attr("transform","rotate(-45)");

	  g.append("g")
		  .attr("class", "ax ax--y")
		  
		  .call(d3.axisLeft(y).ticks(18, "s"))
		.append("text")
		  .attr("x", 2)
		  .attr("y", y(y.ticks(10).pop()))
		  .attr("dy", "0.35em")
		  .attr("text-anchor", "start")
		  .attr("fill", "#000")
		  .attr("fontSize","8px")
		  .text("Casualties");


	  //Add legend
	  d3.selectAll(".legend").remove();
	  
	  var legend = g.selectAll(".legend")
		.data(Object.keys(data[0]).slice(1).reverse())
		.enter().append("g")
		  .attr("class", "legend")
		  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })

	  legend.append("rect")
		  .attr("x", width + 18)
		  .attr("width", 18)
		  .attr("height", 18)
		  .attr("fill", z);

	  legend.append("text")
		  .attr("x", width + 44)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  .attr("text-anchor", "start")
		  .text(function(d) { return d; })

	// Prep the tooltip bits, initial display is hidden
	  var tooltip = g.append("g")
		.attr("class", "tooltip")
		.style("display", "none");//or opacity
		  
	  tooltip.append("rect")
		.attr("width", 60)
		.attr("height", 20)
		.attr("fill", "white")
		.style("opacity", 0.5);
	  
	  tooltip.append("text")
		.attr("x", 30)
		.attr("dy", "1.2em")
		.style("text-anchor", "middle")
		.attr("font-size", "12px")
		.attr("font-weight", "bold");		  
}



