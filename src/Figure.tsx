import { Grid, IconButton } from "@mui/material"
import { useState } from "react"
import CopyIcon from '@mui/icons-material/ContentPaste'
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty'

export const Figure: React.FC<{ figure: string }> = ({ figure }) => {
    const [direction, setDirection] = useState(4)

    const url = `https://figure.parkrp.co/?size=l&figure=${figure}&direction=${direction}&head_direction=${direction}`
    return (<>
        <Grid item display="flex" justifyContent="center">
            <img src={url} alt='avatar' />
        </Grid>
        <Grid item display="flex" justifyContent="center">
            <IconButton title="Rotate" onClick={() => setDirection((direction + 7) % 8)}>
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