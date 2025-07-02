// Import Luxon DateTime
const { DateTime } = luxon;

// Global variables
let borrowTime = null;

/**
 * Convert China time to Chicago time
 * @param {string} chinaTimeStr - ISO string in China timezone
 * @returns {DateTime|null} DateTime object in Chicago timezone
 */
function convertChinaToChicagoTime(chinaTimeStr) {
    return chinaTimeStr ?
        DateTime.fromISO(chinaTimeStr, { zone: "Asia/Shanghai" }).setZone("America/Chicago") :
        null;
}

/**
 * Calculate elapsed time from start time
 * @param {DateTime} startTime - Start time as DateTime object
 * @returns {string} Formatted time string (HH:MM:SS)
 */
function getTimeElapsed(startTime) {
    if (!startTime) return "Invalid Time";

    const diff = DateTime.now().setZone("America/Chicago").diff(startTime, ['hours', 'minutes', 'seconds']);
    const hours = String(diff.hours).padStart(2, '0');
    const minutes = String(diff.minutes).padStart(2, '0');
    const seconds = String(Math.floor(diff.seconds)).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Calculate amount paid based on rental duration
 * @param {DateTime} startTime - Start time as DateTime object
 * @param {DateTime} endTime - End time as DateTime object (optional)
 * @returns {string} Formatted amount string
 */
function calculateAmountPaid(startTime, endTime = null) {
    if (!startTime) return "$0.00";

    const targetTime = endTime || DateTime.now();
    const hoursElapsed = targetTime.diff(startTime, 'hours').hours;
    let amount = 0;

    if (hoursElapsed <= 72) {
        // Charge $3 per day, round up to nearest day
        const days = Math.ceil(hoursElapsed / 24);
        amount = days * 3;
    } else {
        // Flat $40 total if more than 72 hours
        amount = 40;
    }

    return `$${amount.toFixed(2)}`;
}

/**
 * Update the elapsed time and amount paid displays
 */
function updateElapsedTime() {
    if (borrowTime) {
        const elapsedTimeElement = document.getElementById("elapsedTime");
        const amountPaidElement = document.getElementById("amountPaid");

        if (elapsedTimeElement) {
            elapsedTimeElement.textContent = getTimeElapsed(borrowTime);
        }

        if (amountPaidElement) {
            amountPaidElement.textContent = calculateAmountPaid(borrowTime);
        }
    }
}

/**
 * Generate demo mode content
 */
function generateDemoMode() {
    const batteryIdDisplay = document.getElementById("batteryIdDisplay");
    const outputDiv = document.getElementById("output");

    if (batteryIdDisplay) {
        batteryIdDisplay.textContent = "Demo Battery";
    }

    // Generate a random time between 1 and 60 minutes ago
    const randomMinutes = Math.floor(Math.random() * 60) + 1;
    borrowTime = DateTime.now().minus({ minutes: randomMinutes });

    if (outputDiv) {
        outputDiv.innerHTML = `
            <div id="elapsedTimeContainer">
                <p class="demo-label">
                    Rent Duration (Demo)
                </p>
                <p id="elapsedTime">${getTimeElapsed(borrowTime)}</p>
            </div>

            <div class="containers-wrapper">
                <div id="amountPaidContainer">
                    <p class="payment-label">
                        Paid
                    </p>
                    <p id="amountPaid" style="font-family: Arial, sans-serif; font-weight: bold; font-size: 50px;">$3.00</p>
                </div>

                <div id="newContainer" onclick="window.open('https://join.sizl.com/download?gad_source=1&gad_campaignid=22219313015&gbraid=0AAAAAq09m4SKH1GEmpDrN-jVrpvEI0e-C&gclid=Cj0KCQjwpf7CBhCfARIsANIETVpv5sYTNK_JWvoYSKHzHIN21adMO_Wlc2TRaJzJirNyfWokgVHsSVcaAlicEALw_wcB&fbp=fb.1.1751129709957.223715049220526725', '_blank');">
                    <div class="promo-title">
                        $3 OFF
                    </div>
                    <div class="promo-description">
                        Download and register<br>
                        the sizl app to get<br>
                        money back
                    </div>
                    <div class="sizl-text"><i>s</i>izl</div>
                </div>
            </div>
        `;
    }
}

/**
 * Generate returned battery display
 * @param {object} data - Battery data from API
 */
function generateReturnedDisplay(data) {
    const outputDiv = document.getElementById("output");
    if (!outputDiv) return;

    const chiReturnTime = convertChinaToChicagoTime(data.pGhtime);
    const finalAmountPaid = data.finalAmountPaid ||
        calculateAmountPaid(convertChinaToChicagoTime(data.pBorrowtime), chiReturnTime);

    outputDiv.innerHTML = `
        <div id="elapsedTimeContainer">
            <p class="returned-status">
                Battery Returned
            </p>
        </div>

        <div class="containers-wrapper">
            <div id="amountPaidContainer">
                <p class="payment-label">
                    Paid
                </p>
                <p id="amountPaid" style="font-family: Arial, sans-serif; font-weight: bold; font-size: 50px;">${finalAmountPaid}</p>
            </div>
        </div>
    `;
}

/**
 * Generate active rental display
 * @param {object} data - Battery data from API
 */
function generateActiveRentalDisplay(data) {
    const outputDiv = document.getElementById("output");
    if (!outputDiv) return;

    borrowTime = convertChinaToChicagoTime(data.pBorrowtime);

    if (borrowTime) {
        outputDiv.innerHTML = `
            <div id="elapsedTimeContainer">
                <p class="section-label">
                    Rent Duration
                </p>
                <p id="elapsedTime">${getTimeElapsed(borrowTime)}</p>
            </div>

            <div class="containers-wrapper">
                <div id="amountPaidContainer">
                    <p class="payment-label">
                        Paid
                    </p>
                    <p id="amountPaid" style="font-family: Arial, sans-serif; font-weight: bold; font-size: 50px;">${calculateAmountPaid(borrowTime)}</p>
                </div>
            </div>
        `;
    } else {
        outputDiv.innerHTML = `<p class="error-message"><strong>Invalid Borrow Time</strong></p>`;
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const outputDiv = document.getElementById("output");
    if (outputDiv) {
        outputDiv.innerHTML = `<p class="error-message">Error: ${message}</p>`;
    }
}

/**
 * Fetch battery data from API or show demo mode
 */
async function fetchBatteryData() {
    const batteryId = window.location.pathname.substring(1);
    const outputDiv = document.getElementById("output");
    const batteryIdDisplay = document.getElementById("batteryIdDisplay");

    // Demo mode if no battery ID
    if (!batteryId) {
        generateDemoMode();
        return;
    }

    // Set battery ID display
    if (batteryIdDisplay) {
        batteryIdDisplay.textContent = `${batteryId}`;
    }

    // Construct API URL
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const apiUrl = `http://${host}${port}/api/battery/${batteryId}`;

    try {
        // Add loading state
        if (outputDiv) {
            outputDiv.classList.add('loading');
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Battery not found");
        }

        const data = await response.json();

        // Remove loading state
        if (outputDiv) {
            outputDiv.classList.remove('loading');
            // Clear existing content
            outputDiv.innerHTML = "";
        }

        // Check if battery has been returned
        if (data.pGhtime) {
            generateReturnedDisplay(data);
        } else {
            generateActiveRentalDisplay(data);
        }

    } catch (error) {
        if (outputDiv) {
            outputDiv.classList.remove('loading');
        }
        showError(error.message);
        console.error("Error fetching battery data:", error.message);
    }
}

/**
 * Handle customer support contact
 */
function contactSupport() {
    const batteryId = window.location.pathname.substring(1) || "Unknown Battery";
    const message = encodeURIComponent(`The number on my battery is: ${batteryId}`);
    window.location.href = `sms:7736384996?body=${message}`;
}

/**
 * Initialize the application
 */
function initializeApp() {
    // Check if Luxon is available
    if (typeof luxon === 'undefined') {
        console.error('Luxon library not loaded');
        showError('Required library not loaded');
        return;
    }

    // Fetch initial battery data
    fetchBatteryData();

    // Set up periodic updates
    setInterval(updateElapsedTime, 1000); // Update every second
    setInterval(fetchBatteryData, 10000); // Refresh data every 10 seconds
}

/**
 * Handle DOM content loaded
 */
function handleDOMContentLoaded() {
    initializeApp();
}

/**
 * Handle window load (fallback)
 */
function handleWindowLoad() {
    initializeApp();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
} else {
    initializeApp();
}

// Fallback for older browsers
window.addEventListener('load', handleWindowLoad);

// Export functions for potential testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convertChinaToChicagoTime,
        getTimeElapsed,
        calculateAmountPaid,
        contactSupport
    };
}
