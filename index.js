import { parse } from 'node-html-parser';

// Function to fetch and parse the website data
async function fetchIndy500Data() {
    const url = 'https://www.indianapolismotorspeedway.com/events/indy500/event-info/live-grid';
    const response = await fetch(url);
    const html = await response.text();
    const root = parse(html);

    // Helper function to convert string to title case
    function toTitleCase(str) {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Function to extract data from a row
    function extractData(driverCard) {
        const driverNameElement = driverCard.querySelector('h5');

        // Remove the line breaks and replace with a space for the driver names
        const driverName = toTitleCase(driverNameElement.innerHTML.replace('<br>', ' ').replace('<br />', ' ').trim());

        // Driver's team
        const driverTeam = driverCard.querySelector('h6').text.trim();

        // Car Number
        const carNumberUrl = driverCard.querySelector('img.car-endplate').getAttribute('src');
        const carNumberMatch = carNumberUrl.match(/Endplates\/(\d{1,2})-/);
        const carNumber = carNumberMatch ? carNumberMatch[1] : 'Unknown';

        // Grid position
        const gridPositionUrl = driverCard.querySelector('.position').getAttribute('src');
        const gridPositionMatch = gridPositionUrl.match(/liveGridPositions2013\/(\d+)\.png/);
        const gridPosition = gridPositionMatch ? gridPositionMatch[1] : 'Unknown';

        // Car manufacturer
        const carManufacturerUrl = driverCard.querySelector('img.car-manufacturer').getAttribute('src');
        const carManufacturerMatch = carManufacturerUrl.match(/img_(\w+)_logo/);
        const carManufacturer = carManufacturerMatch ? carManufacturerMatch[1].charAt(0).toUpperCase() + carManufacturerMatch[1].slice(1) : 'Unknown';

        // Driver Image
        const driverImage = driverCard.querySelector('.driver-bust > img').getAttribute('src');

        return {
            driverName,
            driverTeam,
            carNumber,
            gridPosition,
            carManufacturer,
            driverImage,
        }
    }

    // Extract all rows and their respective driver cards
    const liveGridContainer = root.querySelector('.live-grid-container');
    const children = liveGridContainer.childNodes;
    let currentRow = null;
    const result = {};

    children.forEach((child) => {
        if (child.tagName === 'H2') {
            // New row
            currentRow = child.text.trim();

            if (!result[currentRow]) {
                result[currentRow] = [];
            }

            // Extract the first driver card from the next sibling
            const firstDriverCardContainer = child.nextElementSibling;

            if (firstDriverCardContainer) {
                const firstDriverCard = firstDriverCardContainer.querySelector('.grid-card');

                if (firstDriverCard) {
                    const data = extractData(firstDriverCard);
                    result[currentRow].push(data);
                }
            }
        } else if (child.classList && child.classList.contains('grid-card')) {
            // Remaining driver cards
            const data = extractData(child);

            if (currentRow) {
                result[currentRow].push(data);
            }
        }
    });

    return result;
}

// Function to format the data as specified
function formatData(data) {
    let formattedString = '';

    Object.keys(data).forEach((rowNumber) => {
        formattedString += `${rowNumber}:\n`;
        data[rowNumber].forEach((driverData) => {
            formattedString += `${driverData.gridPosition}. ${driverData.driverName} (${driverData.carNumber}, ${driverData.driverTeam}, ${driverData.carManufacturer}) - ${driverData.driverImage}\n`;
        });
        formattedString += '\n';
    });

    return formattedString;
}

async function main() {
    const data = await fetchIndy500Data();
    const formattedData = formatData(data);
    console.log(formattedData);
}

main();
