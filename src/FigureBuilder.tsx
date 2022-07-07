import { useEffect, useMemo, useState } from 'react';
import figurepartsTyped from './figureparts.json'
import metadata from './metadata.json'
import { Figure } from './Figure';
import { IAvatar, IMetadata, Trait } from './Metadata'
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
        trait: trait as Trait,
        value
    }))
})

export const FigureBuilder: React.FC<{ baseTraits: IAvatar }> = ({ baseTraits }) => {
    const [searchInput, setSearchInput] = useState('')
    const [traits, setTraits] = useState(baseTraits)
    const [showSuggestionsCount, setShowSuggestionsCount] = useState(16)
    useEffect(() => {
        setTraits(baseTraits)
    }, [baseTraits])

    const hue = traits.Hues
    const complexion = traits.Complexion
    const gender = traits.Gender
    const hairColor = traits['Hair Color']

    const getTraitColor = (trait: Trait, opt: string) => {
        if ((baseTraits[trait] || 'None') === opt) {
            return ''
        }
        const editedWithout = { ...editedTraits } as any
        delete editedWithout[trait]

        if (Object.keys(editedWithout).length === Object.keys(editedTraits).length && burnSuggestions.length) {
            const match = burnSuggestions.find(id => (id.avatar[trait] || 'None') === opt)
            if (match) {
                return ''
            }
        } else {
            const newTraits = {
                ...editedWithout,
                [trait]: opt
            } as IAvatar

            const match = metadata
                .find(avatar => avatar && Object.keys(newTraits).every((edited) =>
                    newTraits[edited as Trait] === (avatar[edited as Trait] || 'None')
                ))
            if (match) {
                return ''
            }
        }
        return 'grey'
    }

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
            const genderPart = gender === 'Male' ? part.m : part.f
            if (!genderPart) {
                return <ListItemIcon title="Trait may be incorrect for this gender"><QuestionMarkIcon /></ListItemIcon>
            }
        } else if (!part) {
            return <ListItemIcon title="Trait info missing"><PriorityHighIcon /></ListItemIcon>
        }

        return null
    }

    const handleSelectTrait = (e: SelectChangeEvent<string>) => selectTrait(e.target.name as Trait, e.target.value)
    const restoreTrait = (name: Trait) => selectTrait(name, baseTraits[name] || 'None')

    const selectTrait = (name: Trait, value: string) => {
        setTraits({
            ...traits,
            [name]: value
        } as IAvatar)
    }

    const editedTraits = useMemo(() => {
        return Object.keys(traits)
            .filter(trait => traits[trait as Trait] !== (baseTraits[trait as Trait] || 'None'))
            .reduce((a, trait) => ({ ...a, [trait]: traits[trait as Trait] }), {}) as IAvatar
        // return traits.filter(trait => trait.value !== (baseTraits.find(baseTrait => baseTrait.trait_type === trait.trait_type)?.value || 'None'))
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

    const burnSuggestions = useMemo(() => {
        if (!Object.keys(editedTraits).length) {
            return []
        }
        const metadataTyped = metadata as IMetadata
        const matches = metadata.map((avatar, id) => ({ avatar, id }))
            .filter(val => val.avatar && Object.keys(editedTraits).every(edited =>
                editedTraits[edited as Trait] === (val.avatar[edited as Trait] || 'None')
            ))
        return matches.sort((m1, m2) => {
            const e1 = rankEffect(metadataTyped[m1.id]['Effect'])
            const e2 = rankEffect(metadataTyped[m2.id]['Effect'])
            if (e1 !== e2) {
                return e1 - e2
            }
            return m1.id - m2.id
        })
    }, [editedTraits])

    useEffect(() => {
        setShowSuggestionsCount(16)
    }, [burnSuggestions])

    const figureString = Object.keys(traits).map(trait => {
        let parts = figureparts[trait]
        if (!parts) {
            // Effect
            return ''
        }
        let part = parts[traits[trait as Trait] as any] as FigurePart
        if (typeof part !== 'string') {
            // Prefer own gender if known, otherwise try the other gender. It may be correct
            part = gender === 'Male' ? part.m || part.f : part.f || part.m
        }
        switch (trait) {
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
                return format(part, figureparts["Hues"][hue][trait])
            case 'Face':
                // Color from complexion
                return format(part, figureparts["Complexion"][complexion])
            case 'Hair':
                // Color from hair color
                return format(part, figureparts["Hair Color"][hairColor || 'None'])
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
                            groupBy={opt => opt.trait}
                            getOptionLabel={opt => `${opt.trait} ${opt.value}`}
                            renderOption={(props, opt) => <MenuItem {...props}>
                                <div 
                                    style={{
                                    display: 'flex',
                                    color: getTraitColor(opt.trait, opt.value)
                                }}>
                                    <ListItemText>{opt.value}</ListItemText>
                                    {getTraitIcon(opt.trait, opt.value)}
                                </div>
                            </MenuItem>}
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
                                    MenuProps={{ disableScrollLock: true }}
                                    name={trait}
                                    label={trait}
                                    value={traits[trait as Trait] || 'None'}
                                    onChange={handleSelectTrait}
                                >
                                    {Object.keys(figureparts[trait]).map(opt => (
                                        <MenuItem key={opt} value={opt}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: getTraitColor(trait as Trait, opt)
                                            }}>
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
                        {Object.keys(editedTraits).map(trait => (
                            <Chip key={trait} label={`${trait}: ${editedTraits[trait as Trait]}`} onDelete={() => restoreTrait(trait as Trait)} />
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {!!Object.keys(editedTraits).length && (
                <>
                    <Grid item xs={12} md={12}>
                        <Box m={1}>
                            {!!burnSuggestions.length && <Typography variant="h6" mb={1}>{burnSuggestions.length} Suggestions</Typography>}
                            {!burnSuggestions.length && <Typography variant="h6" mb={1}>Sorry, no avatar matches selected criteria.</Typography>}
                            {burnSuggestions.slice(0, showSuggestionsCount).map(burn => (
                                <Box display="inline" key={burn.id} m={1} >
                                    <a href={`https://opensea.io/assets/ethereum/0x8a1bbef259b00ced668a8c69e50d92619c672176/${burn.id}`} target="_blank" rel="noreferrer">
                                        <img alt={`#${burn.id}`} src={`https://nft-tokens.habbo.com/avatars/images/${burn.id}.png`} />
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