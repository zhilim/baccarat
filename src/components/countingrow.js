import { Box } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";



var grid = [];


function CountingCircle ({c1, o1}){
    return (
       
        <Box height = "15px">
            <CircleIcon sx = {{fontSize: "12px", color: c1, opacity: o1}}></CircleIcon>
        </Box>
        
    );
}

function CountingRow({params, p_index}){
    var row = [];
    for(var i = 0; i < params.length; i ++){
        var k = p_index.toString() + "_" + i.toString();
        row.push(
            <CountingCircle
                key = {k}
                c1 = {params[i].c}
                o2 = {params[i].o}
            ></CountingCircle>
        );
    }

    return (
        <Box>
            {row}
        </Box>
    );
}



export default function CountingGrids({params}){
    
    grid = [];
    
    for(var i = 0; i < params.length; i++){
        grid.push(<CountingRow
            key = {i}
            params = {params[i]}
            p_index = {i}
        ></CountingRow>);
    }
    
    return grid;
}
