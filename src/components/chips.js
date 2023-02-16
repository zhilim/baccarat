import { Box } from "@mui/material";
import "../App.css";
import { shades } from "../theme";

export const chipImages = [
    {"src": "assets/chips/bluechip.png", "val": 100, "fontcolor": shades.neutral[200]},
    {"src": "assets/chips/pinkchip.png", "val": 50, "fontcolor": shades.neutral[200]},
    {"src": "assets/chips/whitechip.png", "val": 500, "fontcolor": shades.primary[300]},
    {"src": "assets/chips/yellowchip.png", "val": 5, "fontcolor": shades.primary[300]},
    {"src": "assets/chips/greenchip.png", "val": 25, "fontcolor": shades.neutral[200]}
]


export default function Chip({chipvalue, urlsrc, color, isSelected}) {
    return (
        <Box
            style = {{position: "relative", width: "100%", margin: "0px", paddingtop: "0px"}}
            display = "flex"
        >
            <Box height = "100%" className = {isSelected ? "expandchip":"contractchip"}>
                <img 
                    width = "100%" 
                    src = {urlsrc}  
                >
                </img>
            </Box>
            <Box height = "100%" style = {{
                position: "absolute",
                top: "-18%",
                left: "32%",
                paddingtop: "0px",
                margin: "0px"
            }} color = {color}>
                <h6 margin = "0px" paddingtop = "0px">{chipvalue}</h6>
            </Box>
            
        </Box>
    );
}