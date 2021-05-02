var lang = 'en';

function i18nInit() {
    if (navigator.language) {
        var browser_lang = navigator.language;
        if (browser_lang.toLowerCase() == 'zh-tw') {
            lang = 'zh-TW';
        }
        if (browser_lang.toLowerCase() == 'zh-cn') {
            lang = 'zh-CN';
        }
    }

    var url_lang = location.search.substr(1)
    if (url_lang && locales[url_lang]) {
        lang = url_lang;
    }
}

function i18nTranslate(key) {
    return locales[lang][key].message;
}
