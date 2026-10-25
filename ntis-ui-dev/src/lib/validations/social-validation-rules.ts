/**
 * Determines min and max values dynamically based on attribute code.
 */
export function getMinMaxValues(socialAttributeCode: string) {
    const code = socialAttributeCode.toUpperCase();
    let min = 1;
    let max: number | undefined = undefined;

    if (code.includes("STAR_RATING") || code.includes("STAR_RAT") || code === "GREEN_PROPERTY_STAR") {
        min = 1;
        max = 5;
    } else if (code.includes("BOREWELL") || (code.includes("WELL") && !code.includes("BOREWELL"))) {
        min = 1;
        max = 50;
    } else if (code.includes("LIFT")) {
        min = 1;
        max = 100;
    } else if (code.includes("SOLAR")) {
        min = 1;
        max = 5000;
    } else if (code.includes("SWIMMING")) {
        min = 1;
        max = 20;
    } else if (code.includes("TREE")) {
        min = 1;
        max = 100000;
    } else if (code.includes("CAPACITY")) {
        min = 0.01;
        max = 100000;
    } else if (code === "ROAD_WIDTH") {
        min = 0.01;
        max = 500;
    } else if (code === "WATER_CONN_YEAR") {
        min = 1900;
        max = new Date().getFullYear();
    }

    return { min, max };
}
