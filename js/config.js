// ===== KONFIGURASI & STATE GLOBAL =====

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxn3cBxEFFf0jkBYNZNfXc4FkzdVE-WcIJmisniS98HHT3qjFYQ5b72er439zIG_xg8/exec";

// State
let questions = [];
let examItems = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let currentExamData = null;
let timerInterval;
let timeRemainingSeconds = 0;
let isEditMode = false;
let currentAnalysisData = null;
let isSubmitting = false;
let lastErrorToastTime = 0;
let shuffledOptionsMap = {};
let activityLogs = { waktuPerSoal: {}, pindahTab: 0, percobaanCurang: 0 };
let questionStartTime = 0;
let currentScoringConfig = null;

const DEFAULT_SCORING_CONFIG = {
    pg: {
        maxPoints: 1,
        correctPoints: 1,
        wrongPoints: 0,
        blankPoints: 0,
        minPoints: 0,
    },
    pgk: {
        mode: 'manual',
        maxPoints: 3,
        basePoints: 0,
        pointsPerCorrectSelection: 1,
        pointsPerWrongSelection: -1,
        simpleAllCorrectPoints: 3,
        simplePartialPoints: 2,
        simpleAllWrongPoints: 0,
        simpleBlankPoints: 0,
        minPoints: 0,
    },
    bs: {
        mode: 'manual',
        maxPoints: 3,
        basePoints: 0,
        pointsPerCorrectStatement: 1,
        pointsPerWrongStatement: 0,
        simpleAllCorrectPoints: 3,
        simplePartialPoints: 2,
        simpleAllWrongPoints: 0,
        simpleBlankPoints: 0,
        minPoints: 0,
    }
};

function normalizeScoringConfig(scoring) {
    const cfg = scoring || {};
    const num = (value, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };

    const normalized = {
        pg: {
            maxPoints: num(cfg.pg?.maxPoints, DEFAULT_SCORING_CONFIG.pg.maxPoints),
            correctPoints: num(cfg.pg?.correctPoints, DEFAULT_SCORING_CONFIG.pg.correctPoints),
            wrongPoints: num(cfg.pg?.wrongPoints, DEFAULT_SCORING_CONFIG.pg.wrongPoints),
            blankPoints: num(cfg.pg?.blankPoints, DEFAULT_SCORING_CONFIG.pg.blankPoints),
            minPoints: num(cfg.pg?.minPoints, DEFAULT_SCORING_CONFIG.pg.minPoints),
        },
        pgk: {
            mode: (cfg.pgk?.mode === 'simple') ? 'simple' : 'manual',
            maxPoints: num(cfg.pgk?.maxPoints, DEFAULT_SCORING_CONFIG.pgk.maxPoints),
            basePoints: num(cfg.pgk?.basePoints, DEFAULT_SCORING_CONFIG.pgk.basePoints),
            pointsPerCorrectSelection: num(cfg.pgk?.pointsPerCorrectSelection, DEFAULT_SCORING_CONFIG.pgk.pointsPerCorrectSelection),
            pointsPerWrongSelection: num(cfg.pgk?.pointsPerWrongSelection, DEFAULT_SCORING_CONFIG.pgk.pointsPerWrongSelection),
            simpleAllCorrectPoints: num(cfg.pgk?.simpleAllCorrectPoints, DEFAULT_SCORING_CONFIG.pgk.simpleAllCorrectPoints),
            simplePartialPoints: num(cfg.pgk?.simplePartialPoints, DEFAULT_SCORING_CONFIG.pgk.simplePartialPoints),
            simpleAllWrongPoints: num(cfg.pgk?.simpleAllWrongPoints, DEFAULT_SCORING_CONFIG.pgk.simpleAllWrongPoints),
            simpleBlankPoints: num(cfg.pgk?.simpleBlankPoints, DEFAULT_SCORING_CONFIG.pgk.simpleBlankPoints),
            minPoints: num(cfg.pgk?.minPoints, DEFAULT_SCORING_CONFIG.pgk.minPoints),
        },
        bs: {
            mode: (cfg.bs?.mode === 'simple') ? 'simple' : 'manual',
            maxPoints: num(cfg.bs?.maxPoints, DEFAULT_SCORING_CONFIG.bs.maxPoints),
            basePoints: num(cfg.bs?.basePoints, DEFAULT_SCORING_CONFIG.bs.basePoints),
            pointsPerCorrectStatement: num(cfg.bs?.pointsPerCorrectStatement, DEFAULT_SCORING_CONFIG.bs.pointsPerCorrectStatement),
            pointsPerWrongStatement: num(cfg.bs?.pointsPerWrongStatement, DEFAULT_SCORING_CONFIG.bs.pointsPerWrongStatement),
            simpleAllCorrectPoints: num(cfg.bs?.simpleAllCorrectPoints, DEFAULT_SCORING_CONFIG.bs.simpleAllCorrectPoints),
            simplePartialPoints: num(cfg.bs?.simplePartialPoints, DEFAULT_SCORING_CONFIG.bs.simplePartialPoints),
            simpleAllWrongPoints: num(cfg.bs?.simpleAllWrongPoints, DEFAULT_SCORING_CONFIG.bs.simpleAllWrongPoints),
            simpleBlankPoints: num(cfg.bs?.simpleBlankPoints, DEFAULT_SCORING_CONFIG.bs.simpleBlankPoints),
            minPoints: num(cfg.bs?.minPoints, DEFAULT_SCORING_CONFIG.bs.minPoints),
        }
    };

    if (normalized.pg.maxPoints < normalized.pg.minPoints) normalized.pg.maxPoints = normalized.pg.minPoints;
    if (normalized.pgk.maxPoints < normalized.pgk.minPoints) normalized.pgk.maxPoints = normalized.pgk.minPoints;
    if (normalized.bs.maxPoints < normalized.bs.minPoints) normalized.bs.maxPoints = normalized.bs.minPoints;
    return normalized;
}

// Helper: panggil API
async function fetchAppsScriptAPI(action, ...args) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, args }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Call Error:", error);
        throw error;
    }
}
