// Description: This file is used to push data to adobeDataLayer object
// adobeDataLayer declaration
window.adobeDataLayer = window.adobeDataLayer || [];
// Get pageInfo object from global variable
const pageInfoObj = pageInfoGlobal ? JSON.parse(JSON.stringify(pageInfoGlobal)) : {};
// Check if the page is search page
const isSearchPage = window.location.pathname.includes('search');
let formabandonField = '';

// Link Data attributes and parent object mapping
// @update this object to add new data attributes with respective parent object and actual key that needs to be pushed to adobeDataLayer
const linkClickAttributes = {
  "linkcategory": "links|linkCategory",
  "linksection": "links|linkSection",
  "linkname": "links|linkName",
  "linktype": "links|linkType",
  "family": "fonts",
  "foundary": "fonts",
  "language": "fonts"
}

const anonymousIDLife = 15; // 15 minutes
getDataLayerInfo('pageLoad', 'regularPageLoad');

// Push pageInfo to adobeDataLayer
function getDataLayerInfo(eventName, eventInfo) {
  window.adobeDataLayer.push({
    "event": eventName,
    "eventInfo": eventInfo,
    "pageInfo": getPageInfo(),
    "userInfo": getUserInfo(),
    "userOrganization": getUserOrganization(),
    "pageContent": getPageContent(),
    "pageError": getPageErrorInfo()
  });
}

// Get page info
function getPageInfo() {
  return {
    "pageName": pageInfoObj.pageInfo?.pageName ?? '',
    "pageSection": pageInfoObj.pageInfo?.pageSection ?? '',
    "webCountry": pageInfoObj.pageInfo?.webCountry ?? '',
    "webLanguage": pageInfoObj.pageInfo?.webLanguage ?? '',
    "pageUrl": pageInfoObj.pageInfo?.pageUrl ?? '',
    "webCurrency": pageInfoObj.pageInfo?.webCurrency ?? '',
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

// Get page content info
function getPageContent() {
  return {
    "resourceTopic": pageInfoObj.pageContent?.resourceTopic ?? '',
    "resourceTitle": pageInfoObj.pageContent?.resourceTitle ?? '',
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
    "userConsent": pageInfoObj.userInfo?.userConsent ?? getUserConsentInfo(),
    "consentGroup": pageInfoObj.userInfo?.consentGroup ?? getCookieConsentGroupStatus(),
    "anonymisedID": pageInfoObj.userInfo?.anonymisedID ?? getOrSetAnonymousID(),
    "userStatus": pageInfoObj.userInfo?.userStatus ?? 'guest',
  }
}

// Add a click event listener to the document
document.addEventListener('DOMContentLoaded', (e) => {
  getAnalyticsOnLinkClicks();
  document.addEventListener('click', function (event) {
    getClickDataForCookieElements(event.target);
    if (typeof Intercom !== 'undefined') {
      getIntercomAnalytics();
    }
    if (isSearchPage) {
      pushSearchResultClickData();
    }
  }, true);
  if (isSearchPage) {
    getSearchTermAnalytics();
  }
});
if (typeof MktoForms2 === 'undefined') {
  console.log('Load Marketo library form JS to track Marketo forms - https://hello.monotype.com/js/forms2/js/forms2.min.js');
} else {
  MktoForms2.whenReady(function (form) {
    // added a timeout to wait for the form stages to load completely 
    setTimeout(() => {
      let formName = getFormName(form.getFormElem()[0]);
      let formFields = form.getFormElem()[0].querySelectorAll('.mktoField:not([type="hidden"])');
      let formCheckboxes = form.getFormElem()[0].querySelectorAll('.checkbox-wrapper input');
      // create an object for checkbox name and value
      let checkboxObj = {};
      // Loop through all the checkboxes and add name and value to the object
      formCheckboxes.forEach(checkbox => {
        checkboxObj[checkbox.name] = checkbox.value == 'yes' ? 'enable' : 'disable';
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
  } else if (formEl.parentElement.dataset.id) {
    return formEl.parentElement.children[0].innerText;
  } else {
    return formEl.parentElement.previousElementSibling.innerText;
  }
}

// Check if user has opted in for cookie consent - used copilot to generate this function
function getUserConsentInfo() {
  return document.cookie.split(';').filter((item) => item.trim().startsWith('OptanonConsent=')).length ? 'optin' : 'optout';
}

// Get cookie consent group from OptanonConsent cookie key from encoded string - used copilot to generate this function
function getCookieConsentGroup() {
  let cookieConsentGroup = "";
  let cookieConsent = document.cookie.split(';').filter((item) => item.trim().startsWith('OptanonConsent='));
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
  return [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// To get or set the anonymousID in a cookie
function getOrSetAnonymousID() {
  const cookieName = 'anonymousID';
  const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)anonymousID\s*=\s*([^;]*).*$)|^.*$/, '$1');
  if (cookieValue) {
    // Check if the anonymous ID is still valid
    const cookieTimestamp = parseFloat(cookieValue.split('|')[1]);
    if (Date.now() - cookieTimestamp <= `${anonymousIDLife}` * 60 * 1000) {
      return cookieValue.split('|')[0];
    }
  }
  const newAnonymousID = generateAnonymousID();
  const newCookieValue = `${newAnonymousID}|${Date.now()}`;
  document.cookie = `${cookieName}=${newCookieValue}; max-age=${anonymousIDLife * 60}`;
  return newAnonymousID;
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
function getAnalyticsOnLinkClicks() {
  getAllTargetElements()?.forEach(el => {
    el.addEventListener("click", (event) => {
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
        "linkSection": "body-bottom-fixed",
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
        "linkSection": "body-bottom-fixed",
        "linkName": "chat close",
        "linkType": "img"
      }
    });
  });
}

// Push Search Initiate event to data layer 
const searchInputEl = document.querySelector('.form-item-search input');

searchInputEl?.addEventListener('keydown', (event) => {
  if (event.keyCode === 13) {
    let searchEvent = {
      "event": "searchInitiate",
      "search": {
        "searchType": pageInfoObj.search?.searchType ?? 'inline search',
        "searchTerm": event.target.value,
      },
    }
    window.adobeDataLayer.push(searchEvent);
  }
});

function getSearchTermAnalytics() {
  let searchResultCount = document.querySelector(".view-algolia-search")?.dataset.searchCount;
  const urlParams = new URLSearchParams(window.location.search);
  let searchTerm = urlParams.get('search');
  let eventInfo = searchResultCount == 0 ? 'zeroSearchResult' : 'searchComplete';
  window.adobeDataLayer.push({
    "event": "pageLoad",
    "eventInfo": eventInfo,
    "search": {
      "searchType": pageInfoObj.search?.searchType ?? 'inline search',
      "searchTerm": searchTerm,
      "searchResultCount": searchResultCount
    },
  });
}

function pushSearchResultClickData() {
  document.querySelectorAll('.views-row h3 a').forEach((el, index) => {
    el.addEventListener('click', (event) => {
      event.stopImmediatePropagation();
      let searchResultClickEvent = {
        "event": "searchResultClick",
        "search": {
          "searchType": pageInfoObj.search?.searchType ?? 'inline search',
          "searchTerm": searchInputEl?.value,
          "searchResultClickedPosition": index + 1,
          "searchResultClicked": event.target.innerText,
        },
      }
      window.adobeDataLayer.push(searchResultClickEvent);
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
      "formFieldCount": formFields.length,
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
      "formfieldCount": formFields.length,
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
      "formfieldCount": formFields.length,
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
      "formfieldCount": formFields.length,
      "formabandonField": formabandonField,
    }
  }
  window.adobeDataLayer.push(formAbandonEvent);
}

// check if an event is already pushed to data layer
function isEventPushed(eventName) {
  // Iterate through the adobeDataLayer array
  for (var i = 0; i < window.adobeDataLayer.length; i++) {
    var eventData = window.adobeDataLayer[i];
    // Check if the event has the name eventName
    if (eventData && eventData.event === eventName) {
      return true;
    }
  }
  return false;
}

// call getFormAbandonAnalytics when user leaves the page without submitting the form
window.addEventListener('beforeunload', function (e) {
  if (!isEventPushed('formSubmit')) {
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
  console.log("adobeDataLayer: ", window.adobeDataLayer);
});

// Vimeo and mp4 video tracking

const iframes = document.querySelectorAll('iframe');

let milestoneReached = {
  25: false,
  50: false,
  75: false
};

if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') {
  console.log('Load Vimeo Player library to track Vimeo videos - https://player.vimeo.com/api/player.js');
} else {

  Array.from(iframes).map(iframe => {
    if (iframe && iframe.src && iframe.src.includes("vimeo")) {
      const player = new Vimeo.Player(iframe);

      let videoDuration;

      let videoProgressPercent = 0;

      player.getDuration().then(function (duration) {
        videoDuration = duration;
      });

      player.on('play', function () {
        window.adobeDataLayer.push({
          "event": "videoStart",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`
          }
        });
      });

      player.on('pause', function () {
        window.adobeDataLayer.push({
          "event": "videoPause",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`,
            "videoPercent": `${videoProgressPercent}`
          }
        });
      });

      player.on('ended', function () {
        window.adobeDataLayer.push({
          "event": "videoComplete",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`,
            "videoPercent": `${videoProgressPercent}`
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
              "videoName": pageInfoObj.pageInfo?.pageName,
              "videoLength": `${videoDuration}`,
              "videoPercent": `${progress}%`
            }
          });
          milestoneReached[progress] = true;
        } else {
          videoProgressPercent = `${progress}%`;
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


      vid.addEventListener('play', function () {
        window.adobeDataLayer.push({
          "event": "videoStart",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`
          }
        });
      });

      vid.addEventListener('pause', function () {
        window.adobeDataLayer.push({
          "event": "videoPause",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`,
            "videoPercent": `${videoProgressPercent}`
          }
        });
      });

      vid.addEventListener('ended', function () {
        window.adobeDataLayer.push({
          "event": "videoComplete",
          "video": {
            "videoName": pageInfoObj.pageInfo?.pageName,
            "videoLength": `${videoDuration}`,
            "videoPercent": `${videoProgressPercent}`
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
              "videoName": pageInfoObj.pageInfo?.pageName,
              "videoLength": `${videoDuration}`,
              "videoPercent": `${progress}%`
            }
          });
          milestoneReached[progress] = true;
        } else {
          videoProgressPercent = `${progress}%`;
        }
      });

    });
  }
});
