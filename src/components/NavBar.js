import { Box, IconButton } from "@mui/material";
import { shades } from "../theme";
import {MenuOutlined} from "@mui/icons-material";
import LoginIcon from "@mui/icons-material/Login";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";


export default function NavBar({openLeaderBoard}){
    return(
    <Box
        position = "fixed"
        top = "0"
        left = "0"
        zIndex = "1"
        backgroundColor = {shades.primary[400]}
        color = {shades.neutral[300]}
        alignItems = "center"
        width = "100%"
        height = "60px"
        display = "flex"
    >
        <Box
          width = "95%"
          margin = "auto"
          display = "flex"
          justifyContent = "space-between"
          alignItems="center"
        >
            <Box
                color = {shades.neutral[300]}
                height = "42px"
                display = "flex"
                alignItems = "center"
            >
                <h6>Baccarat Legends</h6>
            </Box>
            <Box
                dispaly = "flex"
                justifyContent = "space-between"
                columnGap = "20px"
                zIndex = "2"
            >
                <IconButton 
                    sx = {{color: shades.neutral[300]}}
                    onClick = {openLeaderBoard}
                >
                    <LeaderboardIcon/>
                </IconButton>
                <IconButton sx = {{color: shades.neutral[300]}}>
                    <AccountBalanceWalletIcon/>
                </IconButton>
                <IconButton sx = {{color: shades.neutral[300]}}>
                    <LoginIcon/>
                </IconButton>
                <IconButton sx = {{color: shades.neutral[300]}}>
                    <MenuOutlined/>
                </IconButton>
            </Box>
        </Box>
      </Box>
    );
}