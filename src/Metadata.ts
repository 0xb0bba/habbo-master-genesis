export type IMetadata = IAvatar[]

export interface IAvatar {
    Belt?: string
    Complexion: string
    Effect: string
    Eyewear?: string
    Face: string
    Gender: string
    Hair?: string
    'Hair Color'?: string
    Hat?: string
    'Head Accessory'?: string
    Hues: string
    Jacket?: string
    Jewelry?: string
    Legs?: string
    Mask?: string
    Shirt?: string
    Shoes?: string
}

export type Trait = keyof IAvatar

export interface ITrait {
    trait_type: Trait
    value: string
}

