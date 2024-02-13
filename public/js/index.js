const hairdresserTemplate = document.getElementById('hairdresserTemplate');
const hairdressersContainer = document.getElementById('hairdressersContainer');
const numberOfHairdressers = document.getElementById('numberOfHairdressers');
const searchInput = document.getElementById('searchInput');
const dataSheetViewContainer = document.querySelector('.viewDatasheetContainer');
const dataSheetEditContainer = document.querySelector('.editHairdresserContainer');
const logoutButton = document.getElementById('logoutIcon');
const loginButton = document.getElementById('loginIcon');
const addButton = document.getElementById('addIcon');

const leftContentContainer = document.querySelector('#leftContentContainer');
const currentDataSheetContainer = (localStorage.getItem('isLoggedIn') !== 'true') ? dataSheetViewContainer : dataSheetEditContainer;

if (currentDataSheetContainer === dataSheetViewContainer) {
    dataSheetEditContainer.remove();
} else {
    dataSheetViewContainer.remove();
}

const mapContainer = currentDataSheetContainer.querySelector('.mapContainer');
const editButton = currentDataSheetContainer.querySelector('#hairdresserSubmitButton');
const closeButton = currentDataSheetContainer.querySelector('.closeButton');
const modifLabel = currentDataSheetContainer.querySelector('#isModified');
const loadMoreButton = document.getElementById('loadMoreButton');

let indexPage = 0;
let hairdressers = [];
let filter = searchInput.value;

let currentInfos = [];

let resp = null;

function createMapFor(Lat, Lng) {
    mapContainer.innerHTML = ''; // Clear the map container
    mapboxgl.accessToken = 'pk.eyJ1IjoibGEyMjg2MjgiLCJhIjoiY2xwODFhNzhvMHc5eDJqbDY5eDk1eHRsdCJ9.G8pLJplueekCc7mvrKomTg'
    const map = new mapboxgl.Map({
        container: mapContainer, // container
        style: 'mapbox://styles/mapbox/satellite-streets-v12',// style URL
        center: [Lng, Lat],
        zoom: 18,
    });

    const marker = new mapboxgl.Marker()
        .setLngLat([Lng, Lat])
        .addTo(map);
}

function closeDataSheet() {
    closeButton.classList.remove('stay');
    closeButton.classList.remove('appearing');
    if (currentDataSheetContainer.classList.contains('dataSheetOpened')) {
        closeButton.classList.add('disappearing');
    }
    currentDataSheetContainer.classList.remove('dataSheetOpened');
    leftContentContainer.classList.remove('givePlaceToRightContent');

    let selectedElements = document.querySelectorAll('.selected');
    selectedElements.forEach(element => element.classList.remove('selected'));
}


function editHtmlElement(newData, typeOfDataSheet) {
    if (typeOfDataSheet === 'edit') {
        let element = document.querySelector('.selected');
        element.querySelector('.hairdresserName').textContent = newData[0];
        element.querySelector('.hairdresserStreet').textContent = newData[1] + ' ' + newData[2];
        element.querySelector('.hairdresserCity').textContent = newData[3] + ' ' + newData[4];
        modifLabel.classList.add('showIsModified'); // Ajoute la classe pour montrer lentement le message

        setTimeout(() => {
            modifLabel.classList.remove('showIsModified'); // Enlève la classe pour cacher lentement le message
        }, 2000);
    }
}


async function sendModifiedData(data, typeOfDataSheet) {
    let method = '';
    switch (typeOfDataSheet) {
        case 'edit':
            method = 'PUT';
            break;
        case 'add':
            method = 'POST';
            break;
    }
    const response = await fetch('api/hairdressers', {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token'),
        },
        body: JSON.stringify(data)
    })
    return response;
}


function fillViewDataSheet(infos) {
    currentDataSheetContainer.querySelector('#nameValue').textContent = infos[0];
    currentDataSheetContainer.querySelector('#numberValue').textContent = infos[1];
    currentDataSheetContainer.querySelector('#streetValue').textContent = infos[2];
    currentDataSheetContainer.querySelector('#postalCodeValue').textContent = infos[3];
    currentDataSheetContainer.querySelector('#cityValue').textContent = infos[4];
}

function fillEditDataSheet(infos, typeOfDataSheet) {
    if (typeOfDataSheet === 'edit') {
        currentDataSheetContainer.querySelector('#nameInput').value = infos[0];
        currentDataSheetContainer.querySelector('#numberInput').value = infos[1];
        currentDataSheetContainer.querySelector('#streetInput').value = infos[2];
        currentDataSheetContainer.querySelector('#postalCodeInput').value = infos[3];
        currentDataSheetContainer.querySelector('#cityInput').value = infos[4];
        currentDataSheetContainer.querySelector('#latitudeInput').value = infos[5];
        currentDataSheetContainer.querySelector('#longitudeInput').value = infos[6];
    } else if (typeOfDataSheet === 'add') {
        mapContainer.innerText = '';
        currentDataSheetContainer.querySelector('#nameInput').value = '';
        currentDataSheetContainer.querySelector('#numberInput').value = '';
        currentDataSheetContainer.querySelector('#streetInput').value = '';
        currentDataSheetContainer.querySelector('#postalCodeInput').value = '';
        currentDataSheetContainer.querySelector('#cityInput').value = '';
        currentDataSheetContainer.querySelector('#latitudeInput').value = '';
        currentDataSheetContainer.querySelector('#longitudeInput').value = '';
    }
}


function generateRightContent(hairdresser, typeOfDataSheet) {
    currentInfos = [];
    let id = null;
    let inSwitching = getSwitchingState();
    if (hairdresser !== null) {
        currentInfos = [hairdresser.nom, hairdresser.num, hairdresser.voie, hairdresser.codepostal, hairdresser.ville, hairdresser.lat, hairdresser.lng];
        id = hairdresser.id;
        updateMap(inSwitching, hairdresser)
    }
    closeButton.classList.remove('disappearing', 'appearing');
    closeButton.classList.add(inSwitching ? 'stay' : 'appearing');
    closeButton.addEventListener('click', closeDataSheet);

    if (typeOfDataSheet === 'view') {
        fillViewDataSheet(currentInfos);
    } else {
        fillEditDataSheet(currentInfos, typeOfDataSheet);
        editButton.onclick = () => handleEditButtonClick(id, currentInfos, typeOfDataSheet, hairdresser);
    }
    leftContentContainer.classList.add('givePlaceToRightContent');
    currentDataSheetContainer.classList.add('dataSheetOpened');
}

function handleEditButtonClick(id, currentInfos, typeOfDataSheet, hairdresser) {
    let newInfos = getNewInfosFromDataSheet();
    const data = prepareDataForRequest(id, newInfos);
    const resp = sendModifiedData(data, typeOfDataSheet);

    resp.then(response => handleResponse(response, typeOfDataSheet, newInfos, hairdresser));
}

function getNewInfosFromDataSheet() {
    return [
        dataSheetEditContainer.querySelector('#nameInput').value,
        dataSheetEditContainer.querySelector('#numberInput').value,
        dataSheetEditContainer.querySelector('#streetInput').value,
        dataSheetEditContainer.querySelector('#postalCodeInput').value,
        dataSheetEditContainer.querySelector('#cityInput').value,
        dataSheetEditContainer.querySelector('#latitudeInput').value,
        dataSheetEditContainer.querySelector('#longitudeInput').value
    ];
}


function updateMap(inSwitching, hairdresser) {
    const mapLat = hairdresser.lat;
    const mapLng = hairdresser.lng;
    if (inSwitching === false) {
        setTimeout(() => {
            createMapFor(mapLat, mapLng);
        }, 500);
    } else {
        createMapFor(mapLat, mapLng);
    }
}


function prepareDataForRequest(id, newInfos) {
    return {
        id: id,
        newInfos: {
            nom: newInfos[0],
            num: newInfos[1],
            voie: newInfos[2],
            codepostal: newInfos[3],
            ville: newInfos[4],
            lat: newInfos[5],
            lng: newInfos[6]
        }
    };
}

function handleResponse(response, typeOfDataSheet, newInfos, hairdresser) {
    if (response.ok) {
        if (typeOfDataSheet === 'edit') {
            updateHairdresserInfos(hairdresser, newInfos);
            updateMap(getSwitchingState(), hairdresser);
            editHtmlElement(newInfos, typeOfDataSheet);
        } else if (typeOfDataSheet === 'add') {
            response.json().then(data => {
                alert(data.message);
                window.location.reload();
            });
        }
    } else {
        response.json().then(data => {
            alert(data.message);
            if (data.message === 'Token invalide') {
                window.location.href = '/login.html';
            }
        });
    }
}

function updateHairdresserInfos(hairdresser, newInfos) {
    hairdresser.nom = newInfos[0];
    hairdresser.num = newInfos[1];
    hairdresser.voie = newInfos[2];
    hairdresser.codepostal = newInfos[3];
    hairdresser.ville = newInfos[4];
    hairdresser.lat = newInfos[5];
    hairdresser.lng = newInfos[6];

    currentInfos = newInfos;
}


async function getHairdressers() {
    const response = await fetch(`/api/hairdressers?index=${indexPage}&filter=${filter}`);
    const respJSON = await response.json();
    return respJSON;
}

function getSwitchingState() {
    let inSwitching = false;
    if (currentDataSheetContainer.classList.contains('dataSheetOpened') === true) {
        inSwitching = true;
    }
    return inSwitching;
}

function renderHairdresser(hairdresser, index) {
    const clone = hairdresserTemplate.content.cloneNode(true);
    const hairdresserElement = clone.querySelector('.hairdresserCard');
    let typeOfDataSheet = '';
    hairdresserElement.addEventListener('click', () => {
            if (localStorage.getItem('isLoggedIn') !== 'true') {
                typeOfDataSheet = 'view';
            } else {
                typeOfDataSheet = 'edit';
            }
            if (hairdresserElement.classList.contains('selected')) {
                closeDataSheet();
                hairdresserElement.classList.remove('selected');
            } else {
                let selectedElements = document.querySelectorAll('.selected');
                selectedElements.forEach(element => element.classList.remove('selected'));
                hairdresserElement.classList.add('selected');
                generateRightContent(hairdresser, typeOfDataSheet)
            }
        }
    )
    clone.querySelector('.hairdresserName').textContent = hairdresser.nom;
    const numero = hairdresser.num ?? '';  //vérifie si num existe, sinon met une chaine vide
    clone.querySelector('.hairdresserStreet').textContent = numero + ' ' + hairdresser.voie;
    clone.querySelector('.hairdresserCity').textContent = hairdresser.codepostal + ' ' + hairdresser.ville;
    clone.querySelector('.hairdresserIndex').textContent = index;
    hairdressersContainer.appendChild(clone);
}

function renderHairdressers(hairdressers, startIndex, endIndex) {
    for (let i = startIndex; i < endIndex; i++) {
        if (i < hairdressers.length) {
            renderHairdresser(hairdressers[i], i + 1);
        }
    }
}

async function loadMoreHairdressers(hairdressers) {
    let currentResp = await getHairdressers();
    let hairdressersToAdd = currentResp.hairdressers;
    hairdressersToAdd.forEach(hairdresser => hairdressers.push(hairdresser));
    renderHairdressers(hairdressers, indexPage, indexPage + 10);
    indexPage = hairdressers.length;
}


function checkObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 1
    };
    const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreHairdressers(hairdressers);
            }
        });
    }, options);
    observer.observe(loadMoreButton);
}

async function hairdressersFilter() {
    closeDataSheet();
    filter = searchInput.value;
    hairdressers = [];
    hairdressersContainer.innerHTML = '';
    await prepareTenFirstHairdressers();
}


function checkLogin() {
    let isLogged = localStorage.getItem('isLoggedIn');
    if (isLogged === 'true') {
        loginButton.classList.add('hidden');
        logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.setItem('isLoggedIn', 'false');
                window.location.reload();
            }
        );
        addButton.addEventListener('click', () => {
            document.querySelector('.selected')?.classList.remove('selected');
            generateRightContent(null, 'add');
        });
    } else {
        logoutButton.classList.add('hidden');
        addButton.classList.add('hidden');
        loginButton.addEventListener('click', () => {
                window.location.href = '/login.html';
            }
        );
    }
}

async function init() {
    checkLogin();
    await prepareTenFirstHairdressers();
    loadMoreButton.addEventListener('click', () => loadMoreHairdressers(hairdressers));
    checkObserver();
    searchInput.addEventListener('input', () => {
        setTimeout(hairdressersFilter, 10)
    });
}

async function prepareTenFirstHairdressers() {
    indexPage = 0;
    resp = await getHairdressers();
    hairdressers = resp.hairdressers;
    numberOfHairdressers.textContent = resp.totalNumber.toString();
    renderHairdressers(hairdressers, indexPage, indexPage + 10);
    indexPage = hairdressers.length;
}


init();
