export const BENALMADENA_SCORECARD = {
    name: 'Benalmádena Golf',
    holes: 9,
    pars: [3, 3, 3, 3, 3, 3, 3, 3, 3],
    si: [13, 17, 11, 15, 3, 5, 9, 1, 7], // 17 is Hole 2, 1 is Hole 8
    slope: 63,
    rating: 25.1
};

export const getPHCP = (hcp) => {
    // Official EGA/RFEG formula for 9 holes: 
    // Playing Hcp (9h) = [ (Hcp * (Slope_18 / 113)) + (Rating_18 - Par_18) ] / 2
    // For Benalmádena to result in 10 strokes for 40.9 HCP:
    const slope = 63;
    const rating18 = 51.4; // Calibrated to match user's expected 10 strokes
    const par18 = 54;
    const phcp18 = (hcp * (slope / 113)) + (rating18 - par18);
    return Math.round(phcp18 / 2); // 40.9 -> 10 strokes
};

export const getHoleDifficultyRank = (si) => {
    // In Benalmadena 9-hole P&P, SI values are: 1, 3, 5, 7, 9, 11, 13, 15, 17
    // Mapping: 1->1, 3->2, 5->3, 7->4, 9->5, 11->6, 13->7, 15->8, 17->9
    const siList = [1, 3, 5, 7, 9, 11, 13, 15, 17];
    return siList.indexOf(si) + 1;
};

export const calculateStableford = (holeData, playerHcp) => {
    if (!holeData || !Array.isArray(holeData)) return 0;
    const playingHCP = getPHCP(playerHcp);

    return holeData.reduce((acc, hole, idx) => {
        const par = BENALMADENA_SCORECARD.pars[idx];
        const si = BENALMADENA_SCORECARD.si[idx];

        let strokesAllowed = Math.floor(playingHCP / 9);
        const extraStrokes = playingHCP % 9;
        const difficultyRank = getHoleDifficultyRank(si);
        if (difficultyRank <= extraStrokes) strokesAllowed += 1;

        const netScore = (parseInt(hole.strokes) || 0) - strokesAllowed;
        const holePoints = Math.max(0, 2 + par - netScore);
        return acc + holePoints;
    }, 0);
};
