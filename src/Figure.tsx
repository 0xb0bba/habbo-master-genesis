import { Grid, IconButton } from "@mui/material"
import { useContext, useState } from "react"
import CopyIcon from '@mui/icons-material/ContentPaste'
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty'
import { ImagerContext } from "./ImagerContext"

export const Figure: React.FC<{ figure: string }> = ({ figure }) => {
    const [direction, setDirection] = useState(4)
    const { value } = useContext(ImagerContext)

    const url = `${value}${figure}&direction=${direction}&head_direction=${direction}`
    return (<>
        <Grid item display="flex" justifyContent="center">
            <img src={url} alt='avatar' />
        </Grid>
        <Grid item display="flex" justifyContent="center">
            <IconButton title="Rotate" onClick={() => setDirection((direction + 6) % 8 + 1)}>
                <ThreeSixtyIcon />
            </IconButton>
            <IconButton title="Copy figure string" onClick={() => {
                navigator.clipboard.writeText(figure);
            }}>
                <CopyIcon />
            </IconButton>
        </Grid>
    </>)
}