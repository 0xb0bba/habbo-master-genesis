export interface IMetadata {
    [key: string]: ITrait[]
}

export interface ITrait {
    trait_type: string
    value: string
}

