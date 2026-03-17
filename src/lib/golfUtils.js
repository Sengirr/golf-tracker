export const BENALMADENA_SCORECARD = {
    name: 'Benalmádena Golf',
    holes: 9,
    pars: [3, 3, 3, 3, 3, 3, 3, 3, 3],
    si: [13, 17, 11, 15, 3, 5, 9, 1, 7],
    slope: 63,
    rating: 25.1
};

export const MAJ_SCORECARD = {
    name: 'M.A. Jiménez Golf',
    holes: 9,
    pars: [3, 3, 3, 3, 3, 3, 3, 3, 3],
    si: [17, 15, 9, 5, 7, 13, 1, 3, 11],
    slope: 63, // Fallback as none found specifically for 9h
    rating: 25.0 // Fallback estimate
};

export const SCORECARDS = {
    'Benalmádena Golf': BENALMADENA_SCORECARD,
    'M.A. Jiménez Golf': MAJ_SCORECARD
};

export const getPHCP = (hcp, courseName = 'Benalmádena Golf') => {
    const scorecard = SCORECARDS[courseName] || BENALMADENA_SCORECARD;
    // Official EGA/RFEG formula for 9 holes: 
    // Playing Hcp (9h) = [ (Hcp * (Slope_18 / 113)) + (Rating_18 - Par_18) ] / 2
    const slope = scorecard.slope || 63;
    const rating18 = (scorecard.rating * 2) + 1.3; // Rough calibration
    const par18 = (scorecard.holes * 3) * 2;
    const phcp18 = (hcp * (slope / 113)) + (rating18 - par18);
    return Math.round(phcp18 / 2);
};

export const getHoleDifficultyRank = (si) => {
    const siList = [1, 3, 5, 7, 9, 11, 13, 15, 17];
    const rank = siList.indexOf(si) + 1;
    return rank > 0 ? rank : si; // Fallback to SI if not in list
};

export const calculateStableford = (holeData, playerHcp, courseName = 'Benalmádena Golf') => {
    if (!holeData || !Array.isArray(holeData)) return 0;
    const playingHCP = getPHCP(playerHcp, courseName);
    const scorecard = SCORECARDS[courseName] || BENALMADENA_SCORECARD;

    return holeData.reduce((acc, hole, idx) => {
        const par = scorecard.pars[idx] || 3;
        const si = scorecard.si[idx] || 1;

        let strokesAllowed = Math.floor(playingHCP / 9);
        const extraStrokes = playingHCP % 9;
        const difficultyRank = getHoleDifficultyRank(si);
        if (difficultyRank <= extraStrokes) strokesAllowed += 1;

        const netScore = (parseInt(hole.strokes) || 0) - strokesAllowed;
        const holePoints = Math.max(0, 2 + par - netScore);
        return acc + holePoints;
    }, 0);
};
