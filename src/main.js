// Vimeo player API to track vimeo player events
// import Player from '@vimeo/player';

// Description: This file is used to push data to adobeDataLayer object
// adobeDataLayer declaration
window.adobeDataLayer = window.adobeDataLayer || [];

const crypto = window.crypto || window.msCrypto;

// Get pageInfo object from global variable
const pageInfoObj = typeof pageInfoGlobal != 'undefined' ? JSON.parse(JSON.stringify(pageInfoGlobal)) : {};

// Identifier to check if a page has any custom pageLoad event
const hasCustomPageLoad = pageInfoObj.hasCustomPageLoad ?? false;

let formabandonField = '';

const cookieConsent = document.cookie.split(';').filter((item) => item.trim().startsWith('OptanonConsent='));

// Custom event for link click
const CustomAnalyticsEventEmitter = {
    dispatch: function (eventName, eventData) {
        let customEvent = new CustomEvent(eventName, {
            detail: eventData,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(customEvent);
    }
};

// Link Data attributes and parent object mapping
// @update this object to add new data attributes with respective parent object and actual key that needs to be pushed to adobeDataLayer
const linkClickAttributes = {
    "linkcategory": "links|linkCategory",
    "linksection": "links|linkSection",
    "linkname": "links|linkName",
    "linktype": "links|linkType",
    "family": "font",
    "foundary": "font",
    "language": "font",
    "resourcetopic": "content|resourceTopic",
    "resourcetitle": "content|resourceTitle"
}

const anonymousIDLife = 15; // 15 minutes

// Push pageInfo to adobeDataLayer
function getDataLayerInfo(eventName, eventInfo) {
    let pageLoadData = {
        "event": eventName,
        "eventInfo": eventInfo,
        "pageInfo": getPageInfo(),
        "userInfo": getUserInfo(),
        "userOrganization": getUserOrganization(),
        "pageError": getPageErrorInfo()
    };

    // Loop through the pageInfoObj and check if the key is present in pageLoadData object, if not then add it to the pageLoadData object
    for (let key in pageInfoObj) {
        if (!pageLoadData[key]) {
            pageLoadData[key] = pageInfoObj[key];
        }
    }

    window.adobeDataLayer.push(pageLoadData);
}

// Get page info
function getPageInfo() {
    return {
        "pageName": pageInfoObj.pageInfo?.pageName ?? '',
        "pageSection": !pageInfoObj.pageInfo?.pageSection ? getPageSection() : pageInfoObj.pageInfo?.pageSection,
        "webCountry": pageInfoObj.pageInfo?.webCountry ?? '',
        "webLanguage": pageInfoObj.pageInfo?.webLanguage ?? '',
        "pageUrl": pageInfoObj.pageInfo?.pageUrl ?? '',
        "webCurrency": pageInfoObj.pageInfo?.webCurrency ?? '',
        "findingMethod": pageInfoObj.pageInfo?.findingMethod ?? ''
    }
}

// Get user organization info
function getUserOrganization() {
    return {
        "companyName": pageInfoObj.userOrganization?.companyName ?? '',
        "companyAudience": pageInfoObj.userOrganization?.companyAudience ?? '',
        "companyCountry": pageInfoObj.userOrganization?.companyCountry ?? '',
        "companyIndustry": pageInfoObj.userOrganization?.companyIndustry ?? '',
        "companySubIndustry": pageInfoObj.userOrganization?.companySubIndustry ?? '',
    }
}

// Get page error info
function getPageErrorInfo() {
    return {
        "errorCode": pageInfoObj.pageError?.errorCode ?? '',
        "errorMessage": pageInfoObj.pageError?.errorMessage ?? '',
        "errorType": pageInfoObj.pageError?.errorType ?? '',
    }
}

// Get user info 
function getUserInfo() {
    return {
        "encryptedUserEmail": pageInfoObj.userInfo?.encryptedUserEmail ?? '',
        "userRole": pageInfoObj.userInfo?.userRole ?? '',
        "userSapId": pageInfoObj.userInfo?.userSapId ?? '',
        "userOnTrial": pageInfoObj.userInfo?.userOnTrial ?? '',
        "globalCustId": pageInfoObj.userInfo?.globalCustId ?? '',
        "guid": pageInfoObj.userInfo?.guid ?? '',
        "hasMultipleOrganization": pageInfoObj.userInfo?.hasMultipleOrganization ?? '',
        "associatedOrgCnt": pageInfoObj.userInfo?.associatedOrgCnt ?? '',
        "userConsent": pageInfoObj.userInfo?.userConsent ?? (cookieConsent && cookieConsent.length > 0) ? 'optin' : 'optout',
        "consentGroup": pageInfoObj.userInfo?.consentGroup ?? getCookieConsentGroupStatus(),
        "anonymisedID": pageInfoObj.userInfo?.anonymisedID ?? getAnonymousID(),
        "userStatus": pageInfoObj.userInfo?.userStatus ?? 'guest',
        "Auth0Id": pageInfoObj.userInfo?.Auth0Id ?? '',
    }
}

// Add a click event listener to the document
document.addEventListener('DOMContentLoaded', (e) => {
    delete pageInfoObj.hasCustomPageLoad;
    if (!hasCustomPageLoad) {
        getDataLayerInfo('pageLoad', pageInfoObj.pageInfo?.eventInfo ?? 'regularPageLoad');
    }
    getAnalyticsOnLinkClicks();
    document.addEventListener('click', function (event) {
        getClickDataForCookieElements(event.target);
        let isIntercomElement = event.target.parentElement?.parentElement?.classList.contains('intercom-lightweight-app-launcher-icon') || event.target.classList.contains('intercom-lightweight-app-launcher-icon');
        if (typeof Intercom !== 'undefined' && isIntercomElement) {
            getIntercomAnalytics();
        }
    }, true);
    document.addEventListener('customAnalyticsEvent', function (e) {
        let eventData = e.detail;
        window.adobeDataLayer.push(eventData);
    });
});

function getPageSection() {
    let pathname = window.location.pathname;
    if (typeof Drupal !== 'undefined') {
        return (pathname.split('/')[1] == Drupal.currentLanguage) ? pathname.split('/')[2] : pathname.split('/')[1];
    }
    return pathname.split('/')[1];
}

if (typeof MktoForms2 === 'undefined') {
    console.log('Load Marketo library form JS to track Marketo forms - https://hello.monotype.com/js/forms2/js/forms2.min.js');
} else {
    MktoForms2.whenReady(function (form) {
        // added a timeout to wait for the form stages to load completely before adding event listeners
        setTimeout(() => {
            let formName = getFormName(form.getFormElem()[0]);
            let formFields = form.getFormElem()[0].querySelectorAll('.mktoField:not([type="hidden"])');
            let formCheckboxes = form.getFormElem()[0].querySelectorAll('.checkbox-wrapper input');
            // create an object for checkbox name and value
            let checkboxObj = {};
            // Loop through all the checkboxes and add name and value to the object
            formCheckboxes.forEach(checkbox => {
                if (checkbox.name == 'Mailing_List_Opt_in__c') {
                    checkboxObj['emailCheckBox'] = checkbox.value == 'yes' ? 'enable' : 'disable';
                } else {
                    checkboxObj[checkbox.name] = checkbox.value == 'yes' ? 'enable' : 'disable';
                }
            });
            formabandonField = getformAbandonField(formFields);
            getFormStartAnalytics(form, formName, formFields);
            form.onSubmit(function () {
                getFormSubmitAnalytics(form, formName, formFields, checkboxObj);
            });
            form.onSuccess(function () {
                getFormSuccessAnalytics(form, formName, formFields);
            });
        }, 2000);
    });
}

// add onblur event to all form fields to get the last field that user has interacted with
function getformAbandonField(formFields) {
    let abandonedField = formFields[0]?.name;
    formFields.forEach(field => {
        field.addEventListener('blur', (event) => {
            formabandonField = field.name;
        });
    });
    return abandonedField;
}

function getFormName(formEl) {
    if (formEl.parentElement.classList.contains('gated-marketo')) {
        return formEl.previousElementSibling.innerText;
    } else if (formEl.parentElement.dataset.id || formEl.parentElement.dataset.form) {
        return formEl.parentElement.children[0].innerText;
    } else if (formEl.parentElement.previousElementSibling?.classList.contains('marketo-main-title')) {
        return formEl.parentElement.previousElementSibling.innerText;
    } else return '';
}

// Get cookie consent group from OptanonConsent cookie key from encoded string - used copilot to generate this function
function getCookieConsentGroup() {
    let cookieConsentGroup = "";
    if (cookieConsent.length) {
        cookieConsentGroup = decodeURIComponent(cookieConsent[0]).split('&').filter((item) => item.trim().startsWith('groups='))[0].split('=')[1];
    }
    return cookieConsentGroup;
}

// Get cookie consent group status based on mapping - used copilot to generate this function
function getCookieConsentGroupStatus() {
    let cookieConsentGroup = getCookieConsentGroup();
    const cookieConsentGroupMapping = {
        "C0001": "necessary",
        "C0002": "performance",
        "C0003": "functional",
        "C0004": "targeting"
    }
    let cookieConsentGroupStatus = '';

    let consentGroupObj = {};
    cookieConsentGroup.split(',').forEach(item => {
        let group = item.split(':');
        consentGroupObj[group[0]] = group[1] == 1 ? 'true' : 'false';
    })
    Object.keys(cookieConsentGroupMapping).forEach(key => {
        if (consentGroupObj[key]) {
            cookieConsentGroupStatus += (cookieConsentGroupStatus != '' ? ' | ' : '') + cookieConsentGroupMapping[key] + ':' + consentGroupObj[key];
        } else {
            cookieConsentGroupStatus += (cookieConsentGroupStatus != '' ? ' | ' : '') + cookieConsentGroupMapping[key] + ':false';
        }
    });
    return cookieConsentGroupStatus;
}

// Generate a random anonymous ID
function generateAnonymousID() {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// To get or set the anonymousID in a cookie
function getAnonymousID() {
    const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)anonymousID\s*=\s*([^;]*).*$)|^.*$/, '$1');
    if (cookieValue) {
        // Check if the anonymous ID is still valid
        const cookieTimestamp = parseFloat(cookieValue.split('|')[1]);
        if (Date.now() - cookieTimestamp <= anonymousIDLife * 60 * 1000) {
            setAnonymousID(cookieValue.split('|')[0]);
            return cookieValue.split('|')[0];
        }
    }
    return setAnonymousID(generateAnonymousID());
}

// set the anonymousID in a cookie
function setAnonymousID(anonymisedID) {
    const cookieName = 'anonymousID';
    const cookieValue = `${anonymisedID}|${Date.now()}`;
    document.cookie = `${cookieName}=${cookieValue}; max-age=${anonymousIDLife * 60}`;
    return cookieValue.split('|')[0];
}

// Get all elements with data attributes starting with analytics - used copilot to generate this function
function getAllTargetElements() {
    let analyticsDataElements = [];
    document.querySelectorAll("a, button").forEach(el => {
        let dataAttributes = Object.keys(el.dataset).filter(key => key.startsWith("analytics"));
        if (dataAttributes.length) {
            analyticsDataElements.push(el);
        }
    });
    return analyticsDataElements;
}

// Get analytics data on link clicks - used copilot to generate this function
function getAnalyticsOnLinkClicks(stopPropagation) {
    getAllTargetElements()?.forEach(el => {
        el.addEventListener("click", (event) => {
            stopPropagation ? event.stopImmediatePropagation() : '';
            if (!el.dataset.analyticsIscustomevent) {
                let dataAttributes = Object.keys(el.dataset).filter(key => key.startsWith("analytics"));
                let linkClickData = {};
                dataAttributes.forEach(key => {
                    // remove analytics from key and get category in small case and split by _ and capitalize last word
                    let category = key.replace("analytics", "").toLowerCase();
                    if (linkClickAttributes[category]) {
                        let linkDataAttr = linkClickAttributes[category].split("|");
                        let linkDataAttrKey = linkDataAttr[1] ?? category;
                        // create object with category as key and value as object with key as category and value as data attribute value
                        // check if category already exists in object then add new key value pair to existing object
                        if (linkClickData[linkDataAttr[0]]) {
                            linkClickData[linkDataAttr[0]][linkDataAttrKey] = el.dataset[key];
                        } else {
                            linkClickData[linkDataAttr[0]] = {
                                [linkDataAttrKey]: el.dataset[key]
                            }
                        }
                    }
                });
                // check if linkclickdata has any values then push to dataLayer
                if (Object.keys(linkClickData).length) {
                    pushLinkClickEvent(linkClickData, el.dataset['analyticsEvent'] ?? 'linkClick');
                }
            }
        });
    })
}

// Get click data for cookie elements
function getClickDataForCookieElements(eventTarget) {
    if (eventTarget.id == 'onetrust-accept-btn-handler') {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "accept cookie", "button"), 'linkClick');
    } else if (eventTarget.id == 'onetrust-pc-btn-handler') {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "cookie settings", "button"), 'linkClick');
    } else if (eventTarget.parentNode.id == 'onetrust-policy-text') {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "privacy policy", "button"), 'linkClick');
    } else if (eventTarget.classList.contains('save-preference-btn-handler')) {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "save settings", "button"), 'linkClick');
    } else if (eventTarget.id == 'accept-recommended-btn-handler') {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "allow all", "button"), 'linkClick');
    } else if (eventTarget.classList.contains('onetrust-close-btn-handler')) {
        pushLinkClickEvent(setCookieConsentClicks("privacy policy settings", pageInfoObj.pageInfo?.pageName, "close", "button"), 'linkClick');
    }
}

function setCookieConsentClicks(linkcategory, linksection, linkname, linktype) {
    return {
        "links": {
            "linkCategory": linkcategory,
            "linkSection": linksection,
            "linkName": linkname,
            "linkType": linktype,
        }
    }
}

// function to push link click event to data layer
function pushLinkClickEvent(linkClickData, eventName) {
    let linkClickEvent = {
        "event": eventName,
    }
    // push linkClickData to linkClickEvent
    Object.keys(linkClickData).forEach(key => {
        linkClickEvent[key] = linkClickData[key];
    });
    window.adobeDataLayer.push(linkClickEvent);
}

// Get intercom chatbot analytics and push to data layer
function getIntercomAnalytics() {
    Intercom('onShow', function () {
        window.adobeDataLayer.push({
            "event": "chatInitiate",
            "links": {
                "linkCategory": "chat",
                "linkSection": pageInfoObj.pageInfo?.pageSection,
                "linkName": "chat open",
                "linkType": "img"
            }
        });
    });

    Intercom('onHide', function () {
        window.adobeDataLayer.push({
            "event": "chatClose",
            "links": {
                "linkCategory": "chat",
                "linkSection": pageInfoObj.pageInfo?.pageSection,
                "linkName": "chat close",
                "linkType": "img"
            }
        });
    });
}

// Marketo forms tracking
// Trigger formStart event when user intract with first form field
function getFormStartAnalytics(form, formName, formFields) {
    let formStartEvent = {
        "event": "formStart",
        "form": {
            "formName": formName,
            "formFieldCount": `${formFields.length}`,
        }
    }
    // check if data layer already has formStart event
    formFields.forEach((field) => {
        field.addEventListener('focus', () => {
            if (!isEventPushed('formStart')) {
                window.adobeDataLayer.push(formStartEvent);
            };
        });
    });
}

// Trigger formSubmit event when user submit the form
function getFormSubmitAnalytics(form, formName, formFields, checkboxObj) {
    let formSubmitEvent = {
        "event": "formSubmit",
        "form": {
            "formName": formName,
            "formfieldCount": `${formFields.length}`,
        }
    }
    // Add checkbox object to form object
    Object.assign(formSubmitEvent.form, checkboxObj);
    window.adobeDataLayer.push(formSubmitEvent);
}

// Trigger formSuccess event when user submit the form successfully
function getFormSuccessAnalytics(form, formName, formFields) {
    let formSuccessEvent = {
        "event": "formSuccess",
        "form": {
            "formName": formName,
            "formfieldCount": `${formFields.length}`,
        }
    }
    window.adobeDataLayer.push(formSuccessEvent);
}

// Trigger formAbandon event when user abandon the form
function getFormAbandonAnalytics(form, formName, formFields, formabandonField) {
    let formAbandonEvent = {
        "event": "formAbandon",
        "form": {
            "formName": formName,
            "formfieldCount": `${formFields.length}`,
            "formabandonField": formabandonField,
        }
    }
    window.adobeDataLayer.push(formAbandonEvent);
}

// check if an event is already pushed to data layer
function isEventPushed(eventName) {
    // Iterate through the adobeDataLayer array
    for (const element of window.adobeDataLayer) {
        // Check if the event has the name eventName
        if (element && element.event === eventName) {
            return true;
        }
    }
    return false;
}

// call getFormAbandonAnalytics when user leaves the page without submitting the form
window.addEventListener('beforeunload', function (e) {
    if (isEventPushed('formStart') && !isEventPushed('formSubmit')) {
        // get all forms with class .mktoForm and an id
        let marketoForms = document.querySelectorAll('.mktoForm[id]');
        if (marketoForms.length > 0) {
            marketoForms.forEach(form => {
                let formName = getFormName(form);
                let formFields = form.querySelectorAll('.mktoField:not([type="hidden"])');
                getFormAbandonAnalytics(form, formName, formFields, formabandonField);
            });
        } else {
            let webforms = document.querySelectorAll('.webform-submission-form');
            webforms.forEach(form => {
                let formName = form.previousElementSibling?.innerText;
                // Get all input, select, textarea , checkbox and radio fields from the form
                let formFields = form.querySelectorAll(".analytics-field");
                getFormAbandonAnalytics(form, formName, formFields, formabandonField);
            });
        }
    }
});

// Vimeo and mp4 video tracking

const iframes = document.querySelectorAll('iframe');

let milestoneReached = {
    25: false,
    50: false,
    75: false
};

let videoLengthPercentage = 0;

let videoStarted = false;

if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') {
    console.log('Load Vimeo Player library to track Vimeo videos - https://player.vimeo.com/api/player.js');
} else {
    Array.from(iframes).map(iframe => {
        if (iframe && iframe.src && iframe.src.includes("vimeo")) {
            const player = new Vimeo.Player(iframe);

            let videoDuration;

            let videoProgressPercent = 0;

            let videoName = iframe.parentElement.dataset.analyticsVideoname ? iframe.parentElement.dataset.analyticsVideoname : pageInfoObj.pageInfo?.pageName;

            player.getDuration().then(function (duration) {
                videoDuration = duration;
            });

            player.on('play', function () {
                if (!videoStarted) {
                    window.adobeDataLayer.push({
                        "event": "videoStart",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`
                        }
                    });
                    videoStarted = true;
                }
            });

            player.on('pause', function () {
                videoStarted = false;
                if (videoLengthPercentage < 100) {
                    window.adobeDataLayer.push({
                        "event": "videoPause",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`,
                            "videoPercent": videoProgressPercent
                        }
                    });
                }
            });

            player.on('ended', function () {
                window.adobeDataLayer.push({
                    "event": "videoComplete",
                    "video": {
                        "videoName": videoName,
                        "videoLength": `${videoDuration}`,
                        "videoPercent": videoProgressPercent
                    }
                });
            });

            player.on('timeupdate', function (data) {
                let currentTime = data.seconds;
                let duration = data.duration;

                let progress = Math.floor((currentTime / duration) * 100);

                if (milestoneReached[progress] === false) {
                    window.adobeDataLayer.push({
                        "event": "videoProgress",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`,
                            "videoPercent": progress + "%"
                        }
                    });
                    milestoneReached[progress] = true;
                } else {
                    videoProgressPercent = progress + "%";
                    videoLengthPercentage = progress;
                }
            });
        }
    });
}

const vids = document.querySelectorAll('video');

Array.from(vids).map(vid => {
    let videoSource = vid.querySelector('source');
    if (vid && videoSource.src && videoSource.src.includes("mp4")) {

        vid.addEventListener('loadedmetadata', function () {

            let videoDuration = Math.floor(vid.duration);

            let videoProgressPercent = 0;

            let videoName = vid.dataset.analyticsVideoname ? vid.dataset.analyticsVideoname : pageInfoObj.pageInfo?.pageName;

            vid.addEventListener('play', function () {
                if (!videoStarted) {
                    window.adobeDataLayer.push({
                        "event": "videoStart",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`
                        }
                    });
                    videoStarted = true;
                }
            });

            vid.addEventListener('pause', function () {
                videoStarted = true;
                if (videoLengthPercentage < 100) {
                    window.adobeDataLayer.push({
                        "event": "videoPause",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`,
                            "videoPercent": videoProgressPercent
                        }
                    });
                }
            });

            vid.addEventListener('ended', function () {
                window.adobeDataLayer.push({
                    "event": "videoComplete",
                    "video": {
                        "videoName": videoName,
                        "videoLength": `${videoDuration}`,
                        "videoPercent": videoProgressPercent
                    }
                });
            });

            vid.addEventListener('timeupdate', function () {
                let currentTime = vid.currentTime;

                let progress = Math.floor((Math.floor(currentTime) / videoDuration) * 100);

                if (milestoneReached[progress] === false) {
                    window.adobeDataLayer.push({
                        "event": "videoProgress",
                        "video": {
                            "videoName": videoName,
                            "videoLength": `${videoDuration}`,
                            "videoPercent": progress + "%"
                        }
                    });
                    milestoneReached[progress] = true;
                } else {
                    videoProgressPercent = progress + "%";
                    videoLengthPercentage = progress;
                }
            });

        });
    }
});

// Inline search and search result page analytics

function getUrlParameter(attributeName) {
    var url = window.location.href;
    var urlSearchParams = new URLSearchParams(url);
    var value = urlSearchParams.get(attributeName);
    return value;
}
function sendSearchResultClickInfo(searchType, fontDetail) {
    console.log(fontDetail);
    const eventData = fontDetail.data.eventData;
    let serachObj = {};
    let event = "searchResultClick";
    if (searchType == "inline") {
        serachObj = {
            "searchType": searchType,
            "inlineSearchTerm": eventData.inlineSearchTerm,
            "inlineSearchResultTerm": eventData.inlineSearchResultTerm,
            "inlineSearchResultClicked": fontDetail.data.title,
            "inlineSearchResultClickPos": eventData.positions[0].toString(),
        }
    }
    if (searchType == "wtf") {
        event = "wtfSearchResultClick";
        serachObj = {
            "searchType": searchType,
            "wtfSearchType": "",
            "wtfSearchResultClicked": fontDetail.data.title,
            "wtfSearchResultPage": getUrlParameter("page") ? getUrlParameter("page") : "1",
            "wtfSearchResultClickPos": eventData.positions[0].toString(),
        }
    }
    window.adobeDataLayer.push({
        "event": event,
        "search": serachObj,
        "font": {
            "fontID": fontDetail.data.family_id,
            "fontfamily": fontDetail.data.title,
            "fontFoundry": fontDetail.data.foundry_name,
            "fontSource": "Monotype Fonts",
            "fontActionLocation": "inline search result",
        }
    })
}

function getInlinePageInfo(event, searchObj) {
    let searchData = {};
    searchData.event = event;
    searchData.search = {
        searchType: "inline",
        inlineSearchTerm: searchObj.searchTerm,
        inlineSearchType: searchObj.searchTabName,
        inlineSearchCategory: searchObj.searchCategory,
        inlineSearchCatVal: searchObj.searchCategoryValue,
        inlineSearchSuggestClickedPosition: searchObj.searchSuggestClickedPos.toString(),

    }
    console.log("final search data : ", searchData);
    window.adobeDataLayer.push(searchData);
}
function getSearchResultPageInfo(event, eventInfo, findingMethod, searchObj) {
    let searchData = {};
    searchData.event = event;
    searchData.eventInfo = "searchResultPage";
    if (searchObj.searchType == "inline" || searchObj.searchType == "inline zero search") {
        searchData.eventInfo = "searchResult"
        searchData.search = {
            "searchType": searchObj.searchType,
            "inlineSearchTerm": searchObj.searchTerm,
            "inlineSearchType": searchObj.inlineSearchType,
            "inlineSearchResultCount": searchObj.searchResultCount.toString()
        }
    }
    if (searchObj.searchType == "wtf") {
        searchData.eventInfo = "wtfSearchResultPage";
        searchData.search = {
            "searchType": searchObj.searchType,
            "wtfsearchType": "", // this need to be actually how user landend on wtf page
            "wtfSearchResultCount": searchObj.searchResultCount.toString()
        }
    }
    console.log("final search data", searchData);
    if (event == "pageLoad") {
        pageInfoObj.pageInfo.eventInfo = searchData.eventInfo;
        pageInfoObj.pageInfo.findingMethod = pageInfoObj.pageInfo.findingMethod ? pageInfoObj.pageInfo.findingMethod : findingMethod;
        pageInfoObj.search = searchData.search;
        //console.log("pageInfoObj", pageInfoObj);
        getDataLayerInfo('pageLoad', pageInfoObj.pageInfo.eventInfo ?? 'regularPageLoad');
    } else {
        window.adobeDataLayer.push(searchData);
    }
}

function getSearchFilterData(filterType, filterApplied) {
    const searchFilterData = {
        "event": "filterApplied",
        "filter": {
            "filterType": filterType,
            "filterApplied": filterApplied
        }
    };
    console.log("searchFilterData: ", searchFilterData);
    window.adobeDataLayer.push(searchFilterData);
}

function getSearchSortData(sortData) {
    if (sortData) {
        const searchFilterData = {
            "event": "sortChange",
            "sort": {
                "resultSort": sortData
            }
        };
        console.log("search sort data: ", searchFilterData);
        window.adobeDataLayer.push(searchFilterData);
    }
}

function getSearchTypeTesterData(typeTesterData) {
    if (typeTesterData) {
        const typeTesterEventData = {
            "event": "searchfeature",
            "search": {
                "searchFeature": typeTesterData
            }
        };
        console.log("typeTesterEventData data: ", typeTesterEventData);
        window.adobeDataLayer.push(typeTesterEventData);
    }
}

// Attach the variables and functions to the global object if not used in this script
if (typeof window !== 'undefined') {
    window.CustomAnalyticsEventEmitter = CustomAnalyticsEventEmitter;
    window.sendSearchResultClickInfo = sendSearchResultClickInfo;
    window.getInlinePageInfo = getInlinePageInfo;
    window.getSearchResultPageInfo = getSearchResultPageInfo;
    window.getSearchFilterData = getSearchFilterData;
    window.getSearchSortData = getSearchSortData;
    window.getSearchTypeTesterData = getSearchTypeTesterData;
}