// Configuration de la carte Leaflet centrée sur la Mayenne
export const MAP_CONFIG = {
    CENTER: [48.07, -0.77] as [number, number], // Coordonnées approximatives du centre de la Mayenne
    DEFAULT_ZOOM: 9,
    MIN_ZOOM_OFFSET: -1,
    PADDING: 0.5,
    FIT_PADDING: [20, 20] as [number, number],
};

export const STYLES = {
    MASK: {
        color: "transparent",
        weight: 0,
        fillColor: "#000000",
        fillOpacity: 0.4,
    },
    BORDER: {
        color: "#ffc300",
        weight: 3,
        fillColor: "transparent",
        fillOpacity: 0,
    },
};

export const FILTER_DEFAULTS = {
    ALL: "all",
    YES: "yes",
    NO: "no",
};
