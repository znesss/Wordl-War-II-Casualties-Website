var projection;
var allcountries;
var CountryDeaths=[];
var preClass;
var dataset;
var mymap;

d3.csv("Datasets/powerslocation.csv",  //info: power color and location id
	function (error, csv) {
		if (error) {throw error;}
		csv.forEach(function (d) {
			d.loc = d3.csvParse(d.JasonId).columns;});
		allcountries = csv;
		//console.log(allcountries);

		d3.csv("Datasets/WW2 Casualties - Incidents.csv", // statistics
			function(d) {
				d.DeathsFinal = +d.DeathsFinal;
				if (d.DeathsFinal) return d;},									
			function(error, classes) {
				if (error) throw error;
				dataset= classes;
				
				d3.json("Datasets/world.json", //location
					function (error, world) {
					if (error) {throw error;}
					mymap=world;
					Map(world,"whole")});  //everything starts from here
			});//info
});//power



function Map(world,ar) {
 	if (ar=="whole") {projection = d3.geoMercator().scale(140).translate([300, 500]);}
	if (ar=="europe") {projection = d3.geoMercator().scale(530).translate([270, 1000]);}
	if (ar=="asia") {projection = d3.geoMercator().scale(350).translate([-400, 600]);}
	d3.selectAll("path").remove();

	var MapF = topojson.feature(world, world.objects.countries).features;
	
	d3.select("#map")
		.selectAll("path")
		.data(MapF)
		.enter()
		.append("path")
		.attr("id", function(d) { return d.id; }) 
		.attr("d", d3.geoPath().projection(projection))
		.attr("class","countries");	

	d3.select("#map")
		.append("path")
		.datum(d3.geoGraticule())
		.attr("d", d3.geoPath().projection(projection))
		.attr("fill", "none")
		.attr('stroke', '#c0c0c0')
		.attr('stroke-width', 0.1);
	////////////////////////////////////Permanent colors:
		
	d3.select("#map")
		.selectAll(".countries")
		.attr("class", function(d){ power="countries";
									for (let i=0;i<allcountries.length;i++){
										if(allcountries[i].loc.includes(d.id)){power=allcountries[i].Power;};}
									return power;}
			  )
	//////////////////////////////////////Hover or Click a country:
	d3.select("#map")
		.selectAll(".countries, .axis, .allies, .none")
		
		
		.on("mouseover",function(d){
			d3.select(this)
				.classed("over",true)
				.append("title")
				.text(function(d){
					return info(d.id)[0]+"("+info(d.id)[1]+")"})})
					
		.on("mouseout",function(d){d3.select(this).classed("over",false)})
		
		.on("click", function(d){
			//console.log(d.id)
			[CountryName,CountryMore]=info(d.id); //get info
			[DeathIntervalForce,Eachyear] =stat(CountryName);//get statistics
			
			d3.select("#map")
				.selectAll(".selected")//previous selection to normal
				.attr("class", preClass).classed("over",false); //also don't be over anymore
			preClass = d3.select(this).attr("class"); //then store the class of recently clicked
			d3.select(this)
				.attr("class","selected");//and say it is chosen

			//preparation:
			deadsinfo=[];
			alldead=0;
			for ( let i=0; i<DeathIntervalForce.length; i++){
				alldead+=DeathIntervalForce[i].death;
				deadsinfo.push(DeathIntervalForce[i].death+
								" from " +DeathIntervalForce[i].start+
								" to " +DeathIntervalForce[i].end)}
				if (alldead==0){alldead="no info"}
			
			if (preClass!="country"){ //if we have information
				//show:
				drawpie(CountryName,Eachyear);
				d3.select('#countryname').text(CountryName).attr("class",preClass);
				d3.select('#deathtotal').text("Total deaths: "+alldead );
				
				var item =d3.select("#casdetail")
					.selectAll("li")
					.data(deadsinfo);
				item.exit().remove();
				item.enter()
					.append("li")
					.merge(item)
					.text(function (d) {return d});
				}	
		});
}

function MapRedraw(v){
	maparea=document.getElementById("chosenarea").value;
	Map(mymap,maparea);		
}






function info(locid){//Extract name and more
		var CountryName="no info";
		var CountryMore="no info";
		for(var j=0; j<allcountries.length; j++){
			if (allcountries[j].loc.includes(locid)){
				CountryName=allcountries[j].Country;
				CountryMore=allcountries[j].More};}
		return [CountryName,CountryMore]
}



function stat(Natname){
		var countryinfo=[];
		var interval=[0,0,0,0,0,0,0,0];
		dataset.forEach(function(d) {if (Natname==d.Nationality){countryinfo.push({death:d.DeathsFinal,start:d.StartDate,end:d.EndDate,cause:d.AirForce})}})
		for (let i=0; i<countryinfo.length;i++)
		{
			var years=[39,40,41,42,43,44,45,46];
			s=Number(countryinfo[i].start.slice(-2));
			e=Number(countryinfo[i].end.slice(-2));
			numbers=e-s+1
			for (let y=s;y<=e;y++){interval[years.indexOf(y)]+=Math.round(countryinfo[i].death/numbers);}//compute
			//console.log(interval);  
		}
	//console.log(interval);
	return [countryinfo,interval];
	};
	
	
	
function drawpie(Cname,dataset){ //console.log(data);
 	console.log(dataset);
	year=[1939,1940,1941,1942,1943,1944,1945,1946];
	yearclear=[];
	data=[];
	dataset.forEach(function(d,i) {if (i<8 & d!=0){data.push(d);yearclear.push(year[i]);}});
	
	//data=data.filter(cv => cv != 0);
	d3.selectAll("#pietitle").style("opacity","1.0");
	
	d3.selectAll(".pie").remove();
	
	var svg = d3.select("#piechart").append("svg")
	  .attr("class","pie")
      .attr("width", 300)
      .attr("height", 300)
      .append("g");
    
    svg.append("g")
	  .attr("class", "slices");
    svg.append("g")
      .attr("class", "labels");
    svg.append("g")
      .attr("class", "lines");
    var width =220;
    var height =220;
    var radius = Math.min(width, height)/2;
	var color = d3.scaleOrdinal(["#FFFF94", "#AEAE00", "#DCDC00", "#FF8000", "#FFFF66", "#FFFF0B", "#808000", "#CC6600"]);
	
    var pie = d3.pie().sort(null).value(d => d);
    var arc = d3.arc().innerRadius(radius*0.8).outerRadius(radius*0.6);
    
     var outerArc = d3.arc()
                .outerRadius(radius * 0.9)
                .innerRadius(radius * 0.9);
     
    svg.attr("transform", "translate(" + 150 + "," + 120+ ")");
    
    svg.selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
  	.attr('d', arc)
    .attr('fill', (d,i)=> color(i))
	
	.on("mouseover",function(d){
						d3.select(this)
						.append("title")
						.text(function(d){console.log(d,d.index);return yearclear[d.index];})})
	
    svg.append('g').classed('labels',true);
    svg.append('g').classed('lines',true);
     

    var polyline = svg.select('.lines')
       .selectAll('polyline')
       .data(pie(data))
       .enter().append('polyline')
       .attr('points', function(d) {//label transform
								var pos = outerArc.centroid(d);
								pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
								return [arc.centroid(d), outerArc.centroid(d), pos]});
        

     var label = svg.select('.labels').selectAll('text')
        .data(pie(data))
        .enter().append('text')
        .attr('dy', '.35em')
        .html(function(d) {return d.data; })
            .attr('transform', function(d) {
										var pos = outerArc.centroid(d);
										pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
										return 'translate(' + pos + ')'; })
            .style('text-anchor', function(d) {return (midAngle(d)) < Math.PI ? 'start' : 'end';})
			.style('font-size', "10px");
    
     svg.append('text')
                        .attr('class', 'toolCircle')
                        .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
                        .html(Cname) // add text to the circle.
                        .style('font-size', '.9em')
                        .style('text-anchor', 'middle');
    
    function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; } 
    		
	
}