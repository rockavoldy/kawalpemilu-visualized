export const mapping = function(id, filename) {
  let w = 1200,
      h = 400;

  let margin = {
    top: 60,
    bottom: 40,
    left: 70,
    right: 40
  };

  let width = w - margin.left - margin.right;
  let height = h - margin.top - margin.bottom;

  let tooltip = d3.select("#map")
                  .append("div")
                  .style("position", "fixed")
                  .style("z-index", 1)
                  .style("visibility", "hidden");;

  // define map projection
  let projection = d3.geoMercator()
                    .translate([-1900, 150])
                    .scale([1200]);

  //Define default path generator
  let path = d3.geoPath()
              .projection(projection);
              
  let svg = d3.select("#map")
              .append("svg")
              .attr("id", "chart")
              .attr("width", w)
              .attr("height", h)
              .append("g")
              .attr("tranform", "translate(0" + margin.left + "," + margin.top + ")");

  let commaSeparate = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let date = Date.now();
  let APIurl = "https://kawal-c1.appspot.com/api/c/0?" + date;
  let lengthOfData;
  let jsonFeatures;
  let candidateOneTotal = 0; 
  let candidateTwoTotal = 0;
  let validTotal = 0;
  let invalidTotal = 0;
  let TPSTotal = 0;
  let receivedTPSTotal = 0;
  let unprocessedTPSTotal = 0;
  let errorTPSTotal = 0;

  let legislativeTotal = {
    "PKB": 0,
    "GER": 0,
    "PDI": 0,
    "GOL": 0,
    "NAS": 0,
    "GAR": 0,
    "BER": 0,
    "PKS": 0,
    "PER": 0,
    "PPP": 0,
    "PSI": 0,
    "PAN": 0,
    "HAN": 0,
    "DEM": 0,
    "PBB": 0,
    "PKP": 0,
  }

  let parties = ["PKB", "GER", "PDI", "GOL", "NAS", "GAR", "BER", "PKS", "PER", "PPP", "PSI", "PAN", "HAN", "DEM", "PBB", "PKP"];

  let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  // Scale the color using vote percentage as range for Jokowi Maruf
  let candidateOneColor = d3.scaleLinear()
                            .domain([.5, .6, .7, .8, .9])
                            .range(["#E05F6B", "#DD4F5D", "#C94855", "#B5414D", "#A13A44"])

  // Scale the color using vote percentage as range for Prabowo Sandi
  let candidateTwoColor = d3.scaleLinear()
                            .domain([.5, .6, .7, .8, .9])
                            .range(["#85B4DF", "#79ADDC", "#6E9EC8", "#648EB5", "#597EA1"])


  d3.select("#last-update")
    .text(() => {
      let lastUpdateTime = new Date();
      let time = lastUpdateTime.toLocaleDateString('id-ID', options) + " " + lastUpdateTime.toLocaleTimeString();
      return time;
    })

  d3.json(APIurl, function(error, data) {
    
    lengthOfData = data["children"].length;

    if (lengthOfData == undefined) {
      d3.select("#error-message")
        .attr("display", "flex");
    }

    d3.json("src/assets/json/indonesia.json", function(error, id) {

      if (error) {
        return console.log(error);
      }

      for (let i = 0; i< lengthOfData; i++) {
        // the key to GET the election result data
        let provinceID = data["children"][i][0];
        let provinceName = data["children"][i][1];

        // Number of TPS all over the provinces (according to KPU)
        let provinceTPSNo = data["children"][i][2];
        TPSTotal += provinceTPSNo;

        // ELECTION RESULT DATA STARTS HERE

        // Received TPS data including the number of unprocessed ones
        let receivedTPS = data["data"][provinceID]["sum"]["cakupan"];
        receivedTPSTotal += receivedTPS;

        // Unprocessed TPS
        let unprocessedTPS = data["data"][provinceID]["sum"]["pending"];
        unprocessedTPSTotal += unprocessedTPS;

        // Error TPS
        let errorTPS = data["data"][provinceID]["sum"]["error"];
        errorTPSTotal += errorTPS;

        // The amount of votes that the 1st candidate received
        let candidateOne = data["data"][provinceID]["sum"]["pas1"];
        candidateOneTotal += candidateOne;

        // The amount of votes that the 2nd candidate received
        let candidateTwo = data["data"][provinceID]["sum"]["pas2"];
        candidateTwoTotal += candidateTwo;

        // The amount of votes that is considered valid
        let valid = data["data"][provinceID]["sum"]["sah"];
        validTotal += valid;

        // The amount of votes that is considered invalid
        let invalid = data["data"][provinceID]["sum"]["tSah"];
        invalidTotal += invalid;

        // LEGISLATIVE DATA STARTS HERE

        let legislative = {
          "PKB": 0,
          "GER": 0,
          "PDI": 0,
          "GOL": 0,
          "NAS": 0,
          "GAR": 0,
          "BER": 0,
          "PKS": 0,
          "PER": 0,
          "PPP": 0,
          "PSI": 0,
          "PAN": 0,
          "HAN": 0,
          "DEM": 0,
          "PBB": 0,
          "PKP": 0,
        }

        parties.forEach(function(party) {
          
          if (party == "PKS") {
            legislative[party] = data["data"][provinceID]["sum"]["sej"];  
          } else {
            legislative[party] = data["data"][provinceID]["sum"][party.toLowerCase()];
          }

          if (legislative[party] != undefined) {
            legislativeTotal[party] += legislative[party];  
          }
        })

        let legMax = Object.keys(legislative).reduce((a, b) => legislative[a] > legislative[b] ? a : b);
        

        if (legislative[legMax] == undefined) {
          legMax = "NONE";
        }


        if (i < lengthOfData - 2) {
          jsonFeatures = topojson.feature(id, id.objects.states_provinces).features;

          for (let j = 0; i < jsonFeatures.length; j++) {

            let provinceNameJSON;
            if (jsonFeatures[j]["properties"]["name"] == null) {
                continue;
            } else {
                provinceNameJSON = jsonFeatures[j]["properties"]["name"];
            }

            if (provinceNameJSON.toLowerCase() == provinceName.toLowerCase()) {

              jsonFeatures[j]["properties"]["provinceID"] = provinceID;

              jsonFeatures[j]["properties"]["provinceTPSNo"] = provinceTPSNo;

              jsonFeatures[j]["properties"]["receivedTPS"] = receivedTPS;

              jsonFeatures[j]["properties"]["unprocessedTPS"] = unprocessedTPS;

              jsonFeatures[j]["properties"]["errorTPS"] = errorTPS;

              jsonFeatures[j]["properties"]["candidateOne"] = candidateOne;

              jsonFeatures[j]["properties"]["candidateTwo"] = candidateTwo;

              jsonFeatures[j]["properties"]["valid"] = valid;

              jsonFeatures[j]["properties"]["invalid"] = invalid;

              // LEGISLATIVE VOTES

              parties.forEach(function(party) {
                jsonFeatures[j]["properties"][party] = legislative[party];
              });

              jsonFeatures[j]["properties"]["legMax"] = legMax;
              break;
            }
          }

        }
      }

      let legVoteMax = Object.keys(legislativeTotal).reduce(function(m, k){ return legislativeTotal[k] > m ? legislativeTotal[k] : m }, -Infinity); 
      let legVoteMin = Object.keys(legislativeTotal).reduce(function(m, k){ return legislativeTotal[k] < m ? legislativeTotal[k] : m }, Infinity); 

      let legVoteLogScale = d3.scalePow()
                              .domain([legVoteMin, legVoteMax])
                              .range([40, 80]);

      let legislativeTotalSum = Object.values(legislativeTotal).reduce((a, b) => a + b);

      parties.forEach(function(party) {
        let partyContainer = d3.select("#legislative")
                              .append("div")
                              .attr("class", "partai-container")
        
        let partyContainerImage = partyContainer.append("img")
                                      .attr("id", `${party}-icon`)
                                      .attr("class", "partai-icon")
                                      .attr("src", `src/assets/img/partai/${party}.png`)
                                      .style("width", () => {
                                        return legVoteLogScale(legislativeTotal[party]) + "px";
                                      })
        
        let partyVoteDescription = partyContainer.append("div")
                                    .attr("class", "vote-description")
        
        partyVoteDescription.append("h3")
          .text(`${party}`)
        
        partyVoteDescription.append("h1")
          .attr("id", `${party}-vote`)
          .text(() => {
            return commaSeparate(legislativeTotal[party]);
          })
        
        partyVoteDescription.append("h3")
          .attr("id", `${party}-vote-percentage`)
          .text(() => {
            return `${(legislativeTotal[party]/legislativeTotalSum * 100).toFixed(2)}%`;
          })

      });            
  
      d3.select("#total-votes")
        .text(() => {
          return commaSeparate(validTotal + invalidTotal);
        })

      d3.select("#valid-votes")
        .text(() => {
          return commaSeparate(validTotal);
        })

      d3.select("#valid-votes-percentage")
        .text(() => {
          return (validTotal / (validTotal + invalidTotal) * 100).toFixed(2) + "%";
        })
      
      d3.select("#invalid-votes-percentage")
        .text(() => {
          return (invalidTotal / (validTotal + invalidTotal) * 100).toFixed(2) + "%";
        })
      
      d3.select("#invalid-votes")
        .text(() => {
          return commaSeparate(invalidTotal);
        })

      d3.select("#jokomaruf-vote")
        .text(commaSeparate(candidateOneTotal));
      
      d3.select("#prabowosandi-vote")
        .text(commaSeparate(candidateTwoTotal));

      d3.select("#jokomaruf-vote-percentage")
        .text(() => {
          return (candidateOneTotal / (candidateOneTotal + candidateTwoTotal) * 100).toFixed(2) + "%"
        })
      
      d3.select("#prabowosandi-vote-percentage")
        .text(() => {
          return (candidateTwoTotal / (candidateOneTotal + candidateTwoTotal) * 100).toFixed(2) + "%"
        })

      d3.select("#received-TPS")
        .text(() => {
          return commaSeparate(receivedTPSTotal) + " (" + (receivedTPSTotal/TPSTotal * 100).toFixed(2) +  "%)";
        })

      d3.select("#unprocessed-TPS")
      .text(() => {
        return commaSeparate(unprocessedTPSTotal);
      })

      d3.select("#error-TPS")
      .text(() => {
        return commaSeparate(errorTPSTotal);
      })

      svg.selectAll(".province")
          .data(jsonFeatures)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "province")
          .attr("id", d => {
            return d["properties"]["postal"];
          })
          .style("fill", d => {
            if (d["properties"]["candidateOne"] > d["properties"]["candidateTwo"]) {
              return candidateOneColor(d["properties"]["candidateOne"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]));
            } else {
              return candidateTwoColor(d["properties"]["candidateTwo"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]))
            }
          })
          .style('stroke', 'black')
          .on("mouseover", d => {

            let tempTotal = d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]
            let tempCandidateOnePercentage = ((d["properties"]["candidateOne"] / tempTotal) * 100).toFixed(2)
            let tempCandidateTwoPercentage = ((d["properties"]["candidateTwo"] / tempTotal) * 100).toFixed(2)

            tooltip.html(`
              <div class="tooltip">
                <p style="text-align: center; font-weight: bold; font-size: 14px;">${d["properties"]["name"].toUpperCase()}</p>
                <p style="padding: 0 2px;"><span style="float: left; color: #AC0B13;">${commaSeparate(d["properties"]["candidateOne"])}</span> <span style="float: right; color: #79ADDC;">${commaSeparate(d["properties"]["candidateTwo"])}</span></p><br/>
                <p><span style="float: left; color: #AC0B13;">${tempCandidateOnePercentage}%</span> <span style="float: right; color: #79ADDC;">${tempCandidateTwoPercentage}%</span></p><br/>
              </div>
            `)

            tooltip.style("visibility", "visible");
          })
          .on("mouseout", () => {
              tooltip.style("visibility", "hidden");
          })
          .on("mousemove", () => {
              tooltip.style("top", (d3.event.clientY - 90) + 'px').style("left", (d3.event.clientX - 80) + 'px');    
          })

          // REGENCIES AND CITIES VISUALIZATION ON CLICK

          // .on("click", d => {

          //   let provinceID = d["properties"]["provinceID"];
          //   let url = `https://kawal-c1.appspot.com/api/c/${provinceID}?${date}`;
          //   let jsonFile = `src/assets/json/provinces/${provinceID}.json`

          //   d3.select("#window-panel")
          //     .style("display", "flex");
                          

          //   d3.json(jsonFile, function(error, id) {

          //     if (error) {
          //       return console.log(error);
          //     }

          //     console.log(id);

          //     let jsonFeaturesPanel = topojson.feature(id, id.objects.IDN_adm_2_kabkota).features;

          //     let svgPanel = d3.select("#window-panel")
          //       .append("svg")
          //       .attr("id", "city")
          //       .attr("width", 400)
          //       .attr("height", 400)
          //       .append("g")
          //       .attr("tranform", "translate(0" + margin.left + "," + margin.top + ")");
              

          //     let projectionPanel = d3.geoMercator()
          //           .translate([-7400, 470])
          //           .scale([4500]);

          //     //Define default path generator
          //     let pathPanel = d3.geoPath()
          //                 .projection(projectionPanel);


          //     svgPanel.selectAll(".city")
          //       .data(jsonFeaturesPanel)
          //       .enter()
          //       .append("path")
          //       .attr("d", pathPanel)
          //       .attr("class", "city")
          //       .style("z-index", 99)
          //       .attr("fill", "white")
          //       .style('stroke', 'black')
          //       .style("opacity", 1)

          //   })
              
          // })


        d3.select("#legislative-election")
          .on("click", function(){

            d3.select("#legislative-election")
              .style("background-color", "#B3A395");

            d3.select("#presidential-election")
              .style("background-color", "#DAC6B5");
    
            d3.select("#president")
              .style("display", "none");
    
            d3.select("#legislative")
              .style("display", "block");
    
            svg.selectAll(".province")
              .transition()
              .duration(1000)
              .style("fill", d => {
                if (d["properties"]["legMax"] == "PKB") {
                  return "#358469";
                } else if (d["properties"]["legMax"] == "GER") {
                  return "#CB6055";
                } else if (d["properties"]["legMax"] == "PDI") {
                  return "#AF2A2D";
                } else if (d["properties"]["legMax"] == "GOL") {
                  return "#FAD555";
                } else if (d["properties"]["legMax"] == "NAS") {
                  return "#DF8842";
                } else if (d["properties"]["legMax"] == "GAR") {
                  return "#C68E25";
                } else if (d["properties"]["legMax"] == "BER") {
                  return "#A4C479";
                } else if (d["properties"]["legMax"] == "PKS") {
                  return "#9B9B9B";
                } else if (d["properties"]["legMax"] == "PER") {
                  return "#825DBE";
                } else if (d["properties"]["legMax"] == "PPP") {
                  return "#45563F";
                } else if (d["properties"]["legMax"] == "PSI") {
                  return "#CA879F";
                } else if (d["properties"]["legMax"] == "PAN") {
                  return "#9AB6DF";
                } else if (d["properties"]["legMax"] == "HAN") {
                  return "#A37A86";
                } else if (d["properties"]["legMax"] == "DEM") {
                  return "#354199";
                } else if (d["properties"]["legMax"] == "PKP") {
                  return "#7A100F";
                } else if (d["properties"]["legMax"] == "PBB") {
                  return "#8BAEA1";
                } else {
                  return "None";
                }
              })

            svg.selectAll(".province")
              .style("cursor", "pointer")
              .on("mouseover", d => {
                tooltip.style("visibility", "hidden");
              })
              .on("click", d=> {

                parties.forEach(function(party) {
                  d3.select(`#${party}-vote`)
                    .transition(1000)
                    .text(() => {
                      return commaSeparate(d["properties"][party]);
                    })
                });

                legVoteMax = d["properties"][parties[0]];
                legVoteMin = d["properties"][parties[0]];

                legislativeTotalSum = d["properties"][parties[0]];
                
                for (let i = 1; i < parties.length; i++) {
                  legislativeTotalSum += d["properties"][parties[i]];
                  if (d["properties"][parties[i]] > legVoteMax) {
                    legVoteMax = d["properties"][parties[i]];
                  } else if (d["properties"][parties[i]] < legVoteMin) {
                    legVoteMin = d["properties"][parties[i]];
                  }
                }

                legVoteLogScale = d3.scalePow()
                                    .domain([legVoteMin, legVoteMax])
                                    .range([40, 80]);

                parties.forEach(function(party) {
                  d3.select(`#${party}-icon`)
                    .transition(2000)
                    .style("width", () => {
                      return legVoteLogScale(d["properties"][party]) + "px";
                    })
                });

                parties.forEach(function(party) {
                  d3.select(`#${party}-vote-percentage`)
                    .text(() => {
                      return `${(d["properties"][party]/legislativeTotalSum * 100).toFixed(2)}%`;
                    })
                });

              })
        
          })
    
        d3.select("#presidential-election")
          .on("click", function(){

            d3.select("#legislative-election")
              .style("background-color", "#DAC6B5");

            d3.select("#presidential-election")
              .style("background-color", "#B3A395");
    
            d3.select("#president")
              .style("display", "block");
    
            d3.select("#legislative")
              .style("display", "none");

            svg.selectAll(".province")
              .transition()
              .duration(1000)
              .style("fill", d => {
                if (d["properties"]["candidateOne"] > d["properties"]["candidateTwo"]) {
                  return candidateOneColor(d["properties"]["candidateOne"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]));
                } else {
                  return candidateTwoColor(d["properties"]["candidateTwo"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]))
                }
              })

            svg.selectAll(".province")
              .on("mouseover", d => {

                let tempTotal = d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]
                let tempCandidateOnePercentage = ((d["properties"]["candidateOne"] / tempTotal) * 100).toFixed(2)
                let tempCandidateTwoPercentage = ((d["properties"]["candidateTwo"] / tempTotal) * 100).toFixed(2)
      
                tooltip.html(`
                  <div class="tooltip">
                    <p style="text-align: center; font-weight: bold; font-size: 14px;">${d["properties"]["name"].toUpperCase()}</p>
                    <p style="padding: 0 2px;"><span style="float: left; color: #AC0B13;">${commaSeparate(d["properties"]["candidateOne"])}</span> <span style="float: right; color: #79ADDC;">${commaSeparate(d["properties"]["candidateTwo"])}</span></p><br/>
                    <p><span style="float: left; color: #AC0B13;">${tempCandidateOnePercentage}%</span> <span style="float: right; color: #79ADDC;">${tempCandidateTwoPercentage}%</span></p><br/>
                  </div>
                `)
      
                tooltip.style("visibility", "visible");
              })
            
          })
    })
  })

  

}