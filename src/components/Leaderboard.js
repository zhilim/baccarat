import {Box} from "@mui/material";
import { shades } from "../theme";
import "../App.css";

const ldblist = [
    {"id": "Michael Scott", "val": 123}, 
    {"id": "Jack Jordan", "val": 456}, 
    {"id": "Susan M", "val": 789}, 
    {"id": "Kelly Kapoor", "val": 6969}, 
    {"id": "Kevin Malone", "val": 2323}
];


export default function Leaderboard({isActive}){
    return(
        <Box
            position = "absolute"
            top = "10px"
            height = "500px"
            width = "350px"
            zIndex = "2"
            backgroundColor = {shades.neutral[300]}
            borderRadius = "10px"
            className = {isActive ? "leaderboardactive" : "leaderboardhidden"}
            justifyContent = "center"
            alignItems = "center"
        >
            <Box color = {shades.primary[400]}>
                <h4>Biggest Winners</h4>
            </Box>
            <LeaderboardEntry></LeaderboardEntry>
        </Box>
    );
}

function LeaderboardEntry(){
    const ldbitems = ldblist.map((entry) => 
        <Box
            display = "flex"
            alignItems = "center"
            justifyContent = "space-between"
            key = {entry.id}
            margin = "0px 20px"
            sx = {{padding: "0px 0px"}}
            width = "80%"
            height = "8%"
            color = {shades.primary[400]}
        >
            <Box>
                <h6>{entry.id}</h6>
            </Box>
            <Box>
                <h6>{entry.val}</h6>
            </Box>

            

        </Box>
        
    );
    return ldbitems;
}
