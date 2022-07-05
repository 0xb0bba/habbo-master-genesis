import { useEffect, useMemo, useState } from 'react';
import figurepartsTyped from './figureparts.json'
import metadata from './metadata.json'
import { Figure } from './Figure';
import { IMetadata, ITrait } from './Metadata'
import { Autocomplete, Box, Button, Chip, FormControl, Grid, InputLabel, ListItemIcon, ListItemText, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'

const figureparts = figurepartsTyped as any

const format = function (format: string, ...args: any[]) {
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match
    })
}

type FigurePart = string | { m: string, f: string }

const autocompleteOptions = Object.keys(figureparts).flatMap(trait => {
    return Object.keys(figureparts[trait]).map(value => ({
        trait,
        value
    }))
})

export const FigureBuilder: React.FC<{ baseTraits: ITrait[] }> = ({ baseTraits }) => {
    const [searchInput, setSearchInput] = useState('')
    const [traits, setTraits] = useState(baseTraits)
    const [showSuggestionsCount, setShowSuggestionsCount] = useState(16)
    useEffect(() => {
        setTraits(baseTraits)
    }, [baseTraits])

    const hue = traits.find(trait => trait.trait_type === "Hues")!
    const complexion = traits.find(trait => trait.trait_type === "Complexion")!
    const gender = traits.find(trait => trait.trait_type === "Gender")!
    const hairColor = traits.find(trait => trait.trait_type === "Hair Color")

    const getTraitIcon = (trait: string, opt: string) => {
        if (opt === 'None') {
            return null
        }
        if (trait === 'Hues') {
            const colors = Object.values(figureparts[trait][opt])
            const defined = colors.filter(v => v).length
            if (defined === 0) {
                return <ListItemIcon title="All colors are missing"><PriorityHighIcon /></ListItemIcon>
            } else if (colors.length > defined) {
                return <ListItemIcon title="Some colors may be missing"><QuestionMarkIcon /></ListItemIcon>
            } else {
                // It's still possible we only have 1 of the 2 colors, but not sure which traits might need second color
                return null
            }
        }
        let part = figureparts[trait][opt] as FigurePart
        if (typeof part !== 'string') {
            if (!part.m && !part.f) {
                // Neither are defined
                return <ListItemIcon title="Trait info missing"><PriorityHighIcon /></ListItemIcon>
            }
            // Check if gender specific trait is defined
            const genderPart = gender.value === 'Male' ? part.m : part.f
            if (!genderPart) {
                return <ListItemIcon title="Trait may be incorrect for this gender"><QuestionMarkIcon /></ListItemIcon>
            }
        } else if (!part) {
            return <ListItemIcon title="Trait info missing"><PriorityHighIcon /></ListItemIcon>
        }

        return null
    }

    const handleSelectTrait = (e: SelectChangeEvent<string>) => selectTrait(e.target.name, e.target.value)
    const restoreTrait = (name: string) => selectTrait(name, baseTraits.find(trait => trait.trait_type === name)?.value || 'None')

    const selectTrait = (name: string, value: string) => {
        setTraits([...traits.filter(attr => attr.trait_type !== name), {
            trait_type: name,
            value: value
        }])
    }

    const editedTraits = useMemo(() => {
        return traits.filter(trait => trait.value !== (baseTraits.find(baseTrait => baseTrait.trait_type === trait.trait_type)?.value || 'None'))
    }, [baseTraits, traits])

    const rankEffect = (effect: string) => {
        switch (effect) {
            case 'Basic H':
                return 0
            case 'Golden H':
                return 1
            case 'Diamond H':
                return 2
            case 'Rainbow H':
                return 3
            case 'Trippy H':
                return 4
            case 'Ultra Trippy H':
                return 5
        }
        return 0
    }

    const getTrait = (traits: ITrait[], type: string) => {
        return traits.find(trait => trait.trait_type === type)?.value || 'None'
    }

    const burnSuggestions = useMemo(() => {
        if (!editedTraits.length) {
            return []
        }
        const metadataTyped = metadata as IMetadata
        const matches = Object.keys(metadata)
            .filter(id => editedTraits.every(edited =>
                edited.value === (metadataTyped[id].find(trait => trait.trait_type === edited.trait_type)?.value || 'None')
            ))
        return matches.sort((m1, m2) => {
            const e1 = rankEffect(getTrait(metadataTyped[m1], 'Effect'))
            const e2 = rankEffect(getTrait(metadataTyped[m2], 'Effect'))
            if (e1 !== e2) {
                return e1 - e2
            }
            return parseInt(m1) - parseInt(m2)
        })
    }, [editedTraits])

    useEffect(() => {
        setShowSuggestionsCount(16)
    }, [burnSuggestions])

    const figureString = traits.map(trait => {
        let parts = figureparts[trait.trait_type]
        if (!parts) {
            // Effect
            return ''
        }
        let part = parts[trait.value] as FigurePart
        if (typeof part !== 'string') {
            // Prefer own gender if known, otherwise try the other gender. It may be correct
            part = gender.value === 'Male' ? part.m || part.f : part.f || part.m
        }
        switch (trait.trait_type) {
            case 'Belt':
            case 'Eyewear':
            case 'Hat':
            case 'Head Accessory':
            case 'Jacket':
            case 'Jewelry':
            case 'Legs':
            case 'Mask':
            case 'Shirt':
            case 'Shoes':
                // Color from hue, specific for the trait type. Hopefully we don't need a color for each specific trait option
                // Some traits have 1 color, others have multiple. But passing in multiple seems to work OK
                return format(part, figureparts["Hues"][hue.value][trait.trait_type])
            case 'Face':
                // Color from complexion
                return format(part, figureparts["Complexion"][complexion.value])
            case 'Hair':
                // Color from hair color
                return format(part, figureparts["Hair Color"][hairColor?.value || 'None'])
        }
        return ''
    }).filter(part => part).join('.')

    return (
        <Grid container>
            <Grid item xs={8} md={10}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Autocomplete
                            disablePortal
                            options={autocompleteOptions}
                            getOptionLabel={opt => `${opt.trait} - ${opt.value}`}
                            renderInput={(params) => <TextField {...params} label="Search trait" />}
                            autoHighlight
                            value={null}
                            inputValue={searchInput}
                            onInputChange={(_, value) => {
                                setSearchInput(value)
                            }}
                            onChange={(_, opt) => {
                                setSearchInput('')
                                if (opt) {
                                    selectTrait(opt.trait, opt.value)
                                }
                            }}
                        />
                    </Grid>
                    {Object.keys(figureparts).map(trait => (
                        <Grid key={trait} item xs={6} md={4} xl={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>{trait}</InputLabel>
                                <Select
                                    name={trait}
                                    label={trait}
                                    value={traits.find(attr => attr.trait_type === trait)?.value || 'None'}
                                    onChange={handleSelectTrait}
                                >
                                    {Object.keys(figureparts[trait]).map(opt => (
                                        <MenuItem key={opt} value={opt}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <ListItemText>{opt}</ListItemText>
                                                {getTraitIcon(trait, opt)}
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item container xs={4} md={2} direction="column">
                <Figure figure={figureString} />
                <Grid item>
                    <Box m={1}>
                        {editedTraits.map(trait => (
                            <Chip key={trait.trait_type} label={`${trait.trait_type}: ${trait.value}`} onDelete={() => restoreTrait(trait.trait_type)} />
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {!!editedTraits.length && (
                <>
                    <Grid item xs={12} md={12}>
                        <Box m={1}>
                            {!!burnSuggestions.length && <Typography variant="h6" mb={1}>{burnSuggestions.length} Suggestions</Typography>}
                            {!burnSuggestions.length && <Typography variant="h6" mb={1}>Sorry, no avatar matches selected criteria.</Typography>}
                            {burnSuggestions.slice(0, showSuggestionsCount).map(id => (
                                <Box display="inline" key={id} m={1} >
                                    <a href={`https://opensea.io/assets/ethereum/0x8a1bbef259b00ced668a8c69e50d92619c672176/${id}`} target="_blank" rel="noreferrer">
                                        <img alt={id} src={`https://nft-tokens.habbo.com/avatars/images/${id}.png`} />
                                    </a>
                                </Box>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        {burnSuggestions.length > showSuggestionsCount && <Button variant="text" onClick={() => setShowSuggestionsCount(showSuggestionsCount + 16)}>SHOW MORE</Button>}
                    </Grid>
                </>
            )}
        </Grid>
    )
}