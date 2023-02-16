import './App.css';
import {Box} from "@mui/material";
import { shades } from './theme';
import { useState, useEffect } from 'react';
import Chip from './components/chips';
import { chipImages } from './components/chips';
import { cardImages, backside } from './components/cardImages';
import BetArea from './components/BetArea';
import { useSpring, animated } from "react-spring";
import CountingGrids from './components/countingrow';
import NavBar from './components/NavBar';
import Leaderboard from './components/Leaderboard';


var playerhit = false;
var betmemory = [];

const markergridcols = 20;
const markergridrows = 6;
var deck = [...cardImages, ...cardImages, ...cardImages];
var testercount = 0;

const initGridParams = (cols, color, rows) =>{
  var params = [];
  for (var i =0; i < cols; i++){
    var rpara = [];
    for(var x = 0; x<rows; x++){
      rpara.push({
        "c": color,
        "o": 1,
        "occupied": false
      });
    }
    params.push(rpara);
  }
  return params; 
}


//animate the change in player $$ so that it rolls nicely like a casino
function Number({n}){
  const {number} = useSpring({
    from: {number: 0},
    number: n,
    delay: 0,
    config: {mass: 0.05, tension:100, friction: 5}
  });
  return <animated.div>{number.to((n)=> n.toFixed(0))}</animated.div>
}

function App() {
  //its a 3 deck game...
  

  //init state to show back of cards. For now, its just transparent pending graphics
  const [playercards, setplayercards] = useState([backside, backside]);
  const [playerhitcard, setplayerhitcard] = useState(backside);
  const [bankerhitcard, setbankerhitcard] = useState(backside);
  const [bankercards, setbankercards] = useState([backside, backside]);
  
  //init state of scores and game title/prompt
  const [playerscore, setpscore] = useState(0);
  const [bankerscore, setbscore] = useState(0);
  const [gameprompt, setgp] = useState("");
  
  //helper states to control flow of cards, score and triggering of hits
  //as well as card animations
  const [playerhitturncount, setphitturncount] = useState(0);
  const [trc, settrc] = useState(0);
  const [ptc1, setptc1] = useState(0);
  const [ptc2, setptc2] = useState(0);
  const [btc1, setbtc1] = useState(0);
  const [btc2, setbtc2] = useState(0);
  const [triggerhits, setth] = useState(0);
  const [triggerend, setend] = useState(0);

  const [isp1animating, animatep1] = useState(false);
  const [isp2animating, animatep2] = useState(false);
  const [isb1animating, animateb1] = useState(false);
  const [isb2animating, animateb2] = useState(false);
  const [isp3animating, animatep3] = useState(false);
  const [isb3animating, animateb3] = useState(false);

  //init color state of game title/prompt. If player wins, turn to blue..etc
  const [promptcolor, setcolor] = useState(shades.neutral[100]);
  
  //state of how much player has bet on P, T, or B, and controls what is rendered in that area
  //also controls what animation is playing ie chip flying to banker or player
  const [betvalueplayer,  setbvplayer] = useState({"val": 0, "chipsrc": "", "opac": 0, "color": "", "anim": ""});
  const [betvaluebanker, setbvbanker] = useState({"val": 0, "chipsrc": "", "opac": 0, "color": "", "anim": ""});
  const [betvaluetie, setbvtie] = useState({"val": 0, "chipsrc": "", "opac": 0, "color": "", "anim": ""});

  //init state of which chip player selected
  const [chipselected, setchipselected] = useState(null);
  //init state of how much money player has
  const [playerstack, setplayerstack] = useState(10000);

  //game control boolean
  const [roundStarted, setroundstart] = useState(false);

  const [gridparams, setgridparams] = useState(initGridParams(markergridcols, shades.primary[300], markergridrows));
  const [gridlocator, setglocator] = useState([0, 0, 1]);
  const [winmemory, setwinmem] = useState([]);

  const [lbactive, setlbactive] = useState(false);

  //mem state so that we can undo bets step by step
  //const [betmemory, setbetmem] = useState([{}]);
  
  //these control the flow of the game when user hits deal
  //wait for first card to be dealt, show the score, then deal second card and so on
  //retrospectively could have combined into one function and just architected the timeouts
  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        
        dealplayerfirstcard();
      }, 500);
    }
  }, [trc]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        dealplayersecondcard();
      }, 500);
    }
  }, [ptc1]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        dealbankerfirstcard();
      }, 500);
    }
  }, [ptc2]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        dealbankersecondcard();
      }, 500);
    }
  }, [btc1]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        evaluatenaturalwin();
      }, 50);
    }
  },[btc2]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        dealPlayerHits();
      }, 400);
    }
  }, [triggerhits]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        dealBankerHits();
      }, 500);
    }
  }, [playerhitturncount]);

  useEffect(()=>{
    if(roundStarted){
      setTimeout(()=>{
        endRound();
      }, 200);
    }
  }, [triggerend]);

  //start round when player hits deal, clear old cards, reset stuff
  const startRound = () => {
    console.log("deck count: " + deck.length.toString());
    setcolor(shades.neutral[100]);
    setgp("");
    setpscore(0);
    setbscore(0);
    setplayercards([backside, backside]);
    setplayerhitcard(backside);
    setbankercards([backside, backside]);
    setbankerhitcard(backside);
    animatep1(false);
    animatep2(false);
    animatep3(false);
    animateb1(false);
    animateb2(false);
    animateb3(false);
    setroundstart(true);
    betmemory = [];
    settrc(trc + 1);
  }

  //logic to handle who won, and if player gets or loses money
  //then use timeout to reset the bet state so player can bet again for next round
  //TODO: cannot asynchronously handle multiple player stack deductions, make it into one var at start then one deduction
  const endRound = () => {
    //console.log("round ended");
    var wmem = winmemory;
    //testercount++;
    if(playerscore > bankerscore){
      advanceglocator("p");
      wmem.push("p");
      updateGridSingle(gridlocator[0], gridlocator[1], shades.blueish[200], true);
      //console.log("player wins");
      setgp("Player Wins");
      setcolor(shades.blueish[200]);
      var bounty = 0;
      if(betvalueplayer.val > 0){
        bounty += betvalueplayer.val*2;
        setbvplayer({
          "val": betvalueplayer.val*2, 
          "chipsrc":betvalueplayer.chipsrc,
          "opac": 1,
          "color": betvalueplayer.color,
          "anim": "chiptoplayer"     
        });
        
      }
      if(betvaluebanker.val > 0){
        
        setbvbanker({
          "val": betvaluebanker.val, 
          "chipsrc":betvaluebanker.chipsrc,
          "opac": 1,
          "color": betvaluebanker.color,
          "anim": "chiptobanker"     
        });
      }
      if(betvaluetie.val > 0){
        //console.log("came here");
        
        setbvtie({
          "val": betvaluetie.val, 
          "chipsrc":betvaluetie.chipsrc,
          "opac": 1,
          "color": betvaluetie.color,
          "anim": "chiptobanker"     
        });
      }
      setTimeout(()=>{
        setplayerstack(playerstack + bounty);
      }, 600) 
    }

    if(bankerscore > playerscore){
      advanceglocator("b");
      wmem.push("b");
      updateGridSingle(gridlocator[0], gridlocator[1], shades.secondary[200], true);
      //console.log("banker wins");
      setgp("Banker Wins");
      setcolor(shades.secondary[200]);
      if(betvaluebanker.val > 0){
        var bounty = betvaluebanker.val*2;
        setbvbanker({
          "val": bounty, 
          "chipsrc":betvaluebanker.chipsrc,
          "opac": 1,
          "color": betvaluebanker.color,
          "anim": "chiptoplayer"     
        });
        setTimeout(()=>{
          setplayerstack(playerstack + bounty);
        }, 600) 
      }
      if(betvalueplayer.val > 0){
        
        setbvplayer({
          "val": betvalueplayer.val, 
          "chipsrc":betvalueplayer.chipsrc,
          "opac": 1,
          "color": betvalueplayer.color,
          "anim": "chiptobanker"     
        });
      }
      if(betvaluetie.val > 0){
        //console.log("came here");
        
        setbvtie({
          "val": betvaluetie.val, 
          "chipsrc":betvaluetie.chipsrc,
          "opac": 1,
          "color": betvaluetie.color,
          "anim": "chiptobanker"     
        });
      }
    }

    if(playerscore == bankerscore){
      //wmem.push("t");
      advanceglocator(1);
      updateGridSingle(gridlocator[0], gridlocator[1], shades.neutral[100], true);
      //console.log("tie");
      setgp("Tie");
      setcolor(shades.neutral[100]);
      var bounty = 0;
      if(betvaluetie.val > 0){
        bounty += betvaluetie.val*8;
        setbvtie({
          "val": betvaluetie.val*8, 
          "chipsrc":betvaluetie.chipsrc,
          "opac": 1,
          "color": betvaluetie.color,
          "anim": "chiptoplayer"     
        });
        
      }
      if(betvaluebanker.val > 0){
        bounty += betvaluebanker.val;
        setbvbanker({
          "val": betvaluebanker.val, 
          "chipsrc":betvaluebanker.chipsrc,
          "opac": 1,
          "color": betvaluebanker.color,
          "anim": "chiptoplayer"     
        });
        
      }
      if(betvalueplayer.val > 0){
        //console.log("came here");
        bounty += betvalueplayer.val;
        setbvplayer({
          "val": betvalueplayer.val, 
          "chipsrc":betvalueplayer.chipsrc,
          "opac": 1,
          "color": betvalueplayer.color,
          "anim": "chiptoplayer"     
        });
        
      }
      setTimeout(()=>{
        setplayerstack(playerstack + bounty);
      }, 600) 
    }

    setwinmem(wmem);

    setTimeout(()=>{
      setbvplayer({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });

      setbvtie({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });

      setbvbanker({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });

      setroundstart(false);
    }, 1500)
  }

  const advanceglocator = (currentwin) =>{
    var wmm = winmemory;
    var gloc = gridlocator;
    if(wmm.length == 0){
      return;
    }
    if(wmm[wmm.length-1] == currentwin || currentwin == 1){
      //console.log("advancing to next row");
      if(gloc[1] + 1 < markergridrows && !gridparams[gloc[0]][gloc[1]+1].occupied){
        gloc[1] = gloc[1] + 1;
      }else{
        if(gloc[2]<markergridcols){
          gloc[0] = gloc[0] + 1;
        }else{
          shiftGrid();
          if(gloc[2]-1 >= 0){
            gloc[2] = gloc[2] - 1;
          }else{
            gloc[2] = 0;
          }
        }
      }
    }else{
      //console.log("advancing to next col");
      if(gloc[2] < markergridcols){
        gloc[0] = gloc[2];
        gloc[2] = gloc[2] + 1;
        gloc[1] = 0;
      }else{
        shiftGrid();
        gloc[1] = 0;
      }
      
    }
    setglocator(gloc);
  }

  //random choose player first card
  //TO DO: regen deck when we run out of cards
  const dealplayerfirstcard = () =>{
    if(deck.length < 6){
      deck = [...cardImages, ...cardImages, ...cardImages];
    }
    var d = [];
    var x = Math.floor(Math.random()*deck.length);
    d.push(deck[x]);
    d.push(backside);
    deck.splice(x, 1);
    setpscore(d[0].val);
    setplayercards(d);
    animatep1(true);
    setptc1(ptc1 + 1);
  }

  const dealplayersecondcard = () => {
    var d = playercards;
    var score = playerscore;
    var x = Math.floor(Math.random()*deck.length);
    d[1] = deck[x];
    score += deck[x].val;
    deck.splice(x, 1);
    if(score > 9){
      score -= 10;
    }
    setpscore(score);
    setplayercards(d);
    animatep2(true);
    setptc2(ptc2+1);
  }

  const dealbankerfirstcard = () => {
    var d = [];
    var x = Math.floor(Math.random()*deck.length);
    d.push(deck[x]);
    d.push(backside);
    deck.splice(x, 1);
    setbscore(d[0].val);
    setbankercards(d);
    animateb1(true);
    setbtc1(btc1 + 1);  
  }

  const dealbankersecondcard = () => {
    var d = bankercards;
    var score = bankerscore;
    var x = Math.floor(Math.random()*deck.length);
    d[1] = deck[x];
    score += deck[x].val;
    deck.splice(x, 1);
    if(score > 9){
      score -= 10;
    }
    setbscore(score);
    setbankercards(d);
    animateb2(true);
    setbtc2(btc2+1);
  }

  const evaluatenaturalwin = () =>{
    if(playerscore > 7 || bankerscore > 7){
      setend(triggerend + 1);
    }else{
      //console.log("triggering hits");
      setth(triggerhits + 1);
    }
  }



  const dealPlayerHits = () =>{
    if(playerscore < 6){
      //console.log("hitting player");
      var i = Math.floor(Math.random()*deck.length);
    
      var score = playerscore;
      //console.log(score);
      setplayerhitcard(deck[i]);
      score += deck[i].val;
      //console.log(score);
      deck.splice(i, 1);
      if(score > 9){
        score -= 10;
      }
      playerhit = true;
      setpscore(score);
      animatep3(true);
      setphitturncount(playerhitturncount + 1);


    }

    if(playerscore > 5){
      playerhit = false;
      setphitturncount(playerhitturncount + 1);
    }
  }

  const hitbankerhelper = () =>{
    var i = Math.floor(Math.random()*deck.length);
    var score = bankerscore;
    setbankerhitcard(deck[i]);
    score += deck[i].val;
    deck.splice(i,1);
    if(score>9){
      score -= 10;
    }
    setbscore(score);
    animateb3(true);
    setend(triggerend + 1);
    //console.log("hit banker");
  }

  const dealBankerHits = () =>{
    if(bankerscore < 8){

      if(playerscore > 5 && !playerhit){
        if(bankerscore < 6){
          hitbankerhelper();
        }else{
          setend(triggerend+1);
        }
      }

      if(playerhit){
        if(playerhitcard.val == 8){
          if(bankerscore < 3){
            hitbankerhelper();
          }else{
            setend(triggerend+1);
          }
        }
    
        if(playerhitcard.val < 8 && playerhitcard.val > 5){
          if(bankerscore < 7){
            hitbankerhelper();
          }else{
            setend(triggerend+1);
          }
        }
  
        if(playerhitcard.val == 4 || playerhitcard.val == 5){
          if(bankerscore < 6){
            hitbankerhelper();
          }else{
            setend(triggerend+1);
          }
        }
  
        if(playerhitcard.val == 2 || playerhitcard.val == 3){
          if(bankerscore < 5){
            hitbankerhelper();
          }else{
            setend(triggerend+1);
          }
        }
  
        if(playerhitcard.val == 9 || playerhitcard.val == 0){
          if(bankerscore < 4){
            hitbankerhelper();
          }else{
            setend(triggerend+1);
          }
        }
      }
      
    }else{
      setend(triggerend + 1);
    }  
  }

  const dealCards = () => {
    startRound();
  }

  const selectChip = (value) => {
    setchipselected(value);
  }

  const makeBet = (setbet, currentbet) => {
    if(!roundStarted){
      if(chipselected != null && playerstack >= chipselected.val){
        var b = currentbet.val + chipselected.val;
        //var betmem = [];
        //console.log(betmemory);
        betmemory.push({"refundval": chipselected.val, "chipsrc": currentbet.chipsrc, "opac": currentbet.opac, "color": currentbet.color, "method":setbet, "currentval": currentbet.val});
        setbet({"val": b, "chipsrc": chipselected.src, "opac": 1, "color": chipselected.fontcolor, "anim": ""});
        setplayerstack(playerstack-chipselected.val);
        
      }
    }  
  }

  const clearBets = () => {
    var bounty = 0;
    if(betvalueplayer.val > 0){
      bounty += betvalueplayer.val;
      setbvplayer({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });
      
    }
    if(betvaluebanker.val > 0){
      bounty += betvalueplayer.val;
      setbvbanker({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });
       
    }
    if(betvaluetie.val > 0){
      //console.log("came here");
      bounty += betvalueplayer.val;
      setbvtie({
        "val": 0, 
        "chipsrc":"",
        "opac": 0,
        "color": "",
        "anim": ""     
      });
    }
    setTimeout(()=>{
      setplayerstack(playerstack + bounty);
    }, 50) 
  }

  const undoBets = () => {
    //updateGridSingle(0,0,shades.blueish[300]);
    //console.log(gridparams);
    if(!roundStarted){
      if(betmemory.length != 0){
        var mem = betmemory.pop();
        mem.method({"val": mem.currentval, "chipsrc": mem.chipsrc, "opac": mem.opac, "color": mem.color, "anim": ""});
        setplayerstack(playerstack + mem.refundval);
      }
    }
  }

  const updateGridSingle = (col, row, color, occupancy) =>{
    var p = [...gridparams];
    p[col][row].c = color;
    p[col][row].occupied = occupancy;
    setgridparams(p);
  }

  const shiftGrid = () =>{
    
    var newgrid = [...gridparams];
    
    for( var x = 0; x < newgrid.length; x++){
      for(var y = 0; y < newgrid[x].length; y++){
        if(x+1 < newgrid.length){
          newgrid[x][y].c = newgrid[x+1][y].c;
          newgrid[x][y].o = newgrid[x+1][y].o;
          newgrid[x][y].occupied = newgrid[x+1][y].occupied;

        }else{
          newgrid[x][y].c = shades.primary[300];
          newgrid[x][y].o = 1;
          newgrid[x][y].occupied = false;
        }
      }
    }
    setgridparams(newgrid);
    //console.log(newgrid);
  }

  
  return (
    //Title
    <Box position = "relative">
      <NavBar openLeaderBoard={()=>setlbactive(!lbactive)}></NavBar>
      <Leaderboard isActive = {lbactive}></Leaderboard>
      <div className="App" style = {{maxWidth: '450px', marginTop: '0px', marginBottom: '5px'}}>
      
      <Box 
        display = "flex" 
        alignItems = "center" 
        marginTop = "95px"
        justifyContent = "center" 
        color = {promptcolor}
        height = "20px"
      >
        <h4>
          {gameprompt}
        </h4>
      </Box>
      
      <div 
        className = "card-grid"
        //background-color = "#EBEBEB"
        //min-height = "500px"
      >
        <Box 
          display = "flex"
          margin = "auto"
          //height = "50px"
          width = "60%"
          alignItems = "center"
          justifyContent = "space-between"
          //background = "black"
          //color = {shades.neutral[500]}
          
        >
          <Box color = {shades.blueish[200]} display = "flex" height = "30px" alignItems = "center">
            <h4>P</h4>
          </Box>
          <Box color = {shades.secondary[200]} display = "flex" height = "40px" alignItems = "center">
            <h4>B</h4>
          </Box>
        </Box>

      </div>
      <Box 
        id = "scores"
        display = "flex"
        margin = "auto"
        height = "40px"
        width = "60%"
        //alignItems = "center"
        justifyContent = "space-between"
        columnGap = "10px"
      >
        <Box color = {shades.neutral[100]} display = "flex" alignItems = "center" height = "50px">
          <h3>{playerscore}</h3>
        </Box>
        <Box color = {shades.neutral[100]} display = "flex" alignItems = "center" height = "50px">
          <h3>{bankerscore}</h3>
        </Box>

      </Box>
      <div id = "cardshere">
        <Box
          display = "flex"
          margin = "auto"
          //maxwidth = "800px"
          width = "90%"
          alignItems = "center"
          justifyContent = "center"
          columnGap = "30px"
        >
          <Box 
            justifyContent="space-between" 
            columnGap = "5px"
            display = "flex"
            alignItems = "center"
          >
            <img className = {isp1animating ? "flyin":"notflyin"} width = "45%" src = {playercards[0].src} />
            <img className = {isp2animating ? "flyin":"notflyin"} width = "45%" src = {playercards[1].src} />
          </Box>
            
          <Box
            justifyContent="space-between" 
            columnGap = "5px"
            display = "flex"
            alignItems = "center"
          >
            <img className = {isb1animating ? "flyin":"notflyin"} width = "45%" src = {bankercards[0].src} />
            <img className = {isb2animating ? "flyin":"notflyin"} width = "45%" src = {bankercards[1].src} />
          </Box>
        </Box>
        <Box
          display = "flex"
          //height = "100px"
          margin = "auto"
          width = "80%"
          //padding = "0"
          alignItems = "top"
          justifyContent= "space-between"
          columnGap="10px"
        >
          <img className = {isp3animating ? "rotate90flyin" : "notflyin"} width = "23%" src = {playerhitcard.src} />
          <img className = {isb3animating ? "rightin" : "notflyin"} width = "23%" src = {bankerhitcard.src} />
        </Box>
      </div>
      <Box display = "flex" justifyContent = "center" height = "30px" margin = "auto" alignItems = "center" paddingBottom= "0px">
        <h4> --------  BET  -------- </h4>
      </Box>
      <Box
        display = "flex"
        margin = "auto"
        width = "90%"
        justifyContent = "space-between"
        columnGap = "5px"
      >
        <Box
          width = "50%"
          onClick = {() => makeBet(setbvplayer, betvalueplayer)}
        >
          <BetArea
            tcolor = {shades.blueish[200]}
            title = "Player"
            chipsrc = {betvalueplayer.chipsrc}
            betvalue = {betvalueplayer.val}
            betcolor = {betvalueplayer.color}
            opac = {betvalueplayer.opac}
            anim = {betvalueplayer.anim}
          ></BetArea>
        </Box>
        <Box 
          width = "50%"
          onClick = {()=> makeBet(setbvtie, betvaluetie)}
        >
          <BetArea
            tcolor = {shades.neutral[300]}
            title = "Tie"
            chipsrc = {betvaluetie.chipsrc}
            betvalue = {betvaluetie.val}
            betcolor = {betvaluetie.color}
            opac = {betvaluetie.opac}
            anim = {betvaluetie.anim}
          ></BetArea>
        </Box>
        <Box 
          width = "50%"
          onClick = {()=> makeBet(setbvbanker, betvaluebanker)}
        >
          <BetArea
            tcolor = {shades.secondary[200]}
            title = "Banker"
            chipsrc = {betvaluebanker.chipsrc}
            betvalue = {betvaluebanker.val}
            betcolor = {betvaluebanker.color}
            opac = {betvaluebanker.opac}
            anim = {betvaluebanker.anim}
          ></BetArea>
        </Box>
        
      </Box>
      <Box
        height = "40px"
        display = "flex"
        margin = "auto"
        paddingTop = "15px"
        paddingBottom = "0px"
        width = "90%"
        justifyContent="space-between"
        columnGap = "15px"
      >
        <Box 
          onClick = {() => selectChip(chipImages[3])}
          className = {roundStarted ? "chipgoaway":"chipcomeback"}
        >
          <Chip 
            chipvalue = {chipImages[3].val} 
            urlsrc = {chipImages[3].src}
            color = {shades.primary[300]}
            isSelected = {chipselected == chipImages[3]}
          ></Chip>
        </Box>
        <Box 
          onClick = {() => selectChip(chipImages[4])}
          className = {roundStarted ? "chipgoaway":"chipcomeback"}
        >
          <Chip 
            chipvalue = {chipImages[4].val} 
            urlsrc = {chipImages[4].src}
            color = {shades.neutral[100]}
            isSelected = {chipselected == chipImages[4]}
          ></Chip>
        </Box>
        <Box 
          onClick = {() => selectChip(chipImages[1])}
          className = {roundStarted? "chipgoaway":"chipcomeback"}
        >
          <Chip 
            chipvalue = {chipImages[1].val} 
            urlsrc = {chipImages[1].src}
            color = {shades.neutral[100]}
            isSelected = {chipselected == chipImages[1]}
          ></Chip>
        </Box>
        <Box 
          onClick = {() => selectChip(chipImages[0])}
          className = {roundStarted? "chipgoaway":"chipcomeback"}
        >
          <Chip 
            chipvalue = {chipImages[0].val} 
            urlsrc = {chipImages[0].src}
            color = {shades.neutral[100]}
            isSelected = {chipselected == chipImages[0]}
          ></Chip>
        </Box>
        <Box 
          onClick = {() => selectChip(chipImages[2])}
          className = {roundStarted? "chipgoaway":"chipcomeback"}
        >
          <Chip 
            chipvalue = {chipImages[2].val} 
            urlsrc = {chipImages[2].src}
            color = {shades.primary[300]}
            isSelected = {chipselected == chipImages[2]}
          ></Chip>
        </Box>
        
      </Box>
      <Box display="flex" justifyContent="center" height = "40px" marginTop = "30px">
        <Number n = {playerstack}></Number>
      </Box>
      <Box width = "90%" display = "flex" justifyContent = "space-between" margin = "auto" alignContent="center">
        <Box width = "50%" margin = "auto" className = {roundStarted ? "chipgoaway":"chipcomeback"}>
          <button onClick = {clearBets} style = {{fontWeight: "normal", border: "1px solid whitesmoke"}}>
            <h5 style = {{margin: "0px 0px"}}>Clear</h5>
          </button>
        </Box>
        <Box width = "50%" margin = "auto" className = {roundStarted ? "chipgoaway":"chipcomeback"}>
          <button onClick = {dealCards} style = {{padding: "16px 16px"}}>
            <h5 style = {{margin: "0px 0px"}}>DEAL</h5>
          </button>
        </Box>

        <Box width = "50%" margin = "auto" className = {roundStarted ? "chipgoaway":"chipcomeback"}>
          <button onClick = {undoBets} style = {{fontWeight: "normal", border: "1px solid whitesmoke"}}>
            <h5 style = {{margin: "0px 0px"}}>Undo</h5>
          </button>
        </Box>
        
      </Box>
      <Box display = "flex" margin = "10px 20px" width = "90%" justifyContent = "space-between">
        <CountingGrids
          params = {gridparams} 
        ></CountingGrids>
      </Box>
      
    </div>
    </Box>
    
  );
}

export default App;
