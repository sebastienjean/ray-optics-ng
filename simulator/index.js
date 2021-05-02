function initGUI() {
    i18nInit();

    var downarraw = '\u25BC';
    document.title = i18nTranslate('appName');

    // Toolbar
    document.getElementById('toolbar_title').innerHTML = i18nTranslate('toolbar_title');

    //Ray
    document.getElementById('tool_laser').value = i18nTranslate('toolname_laser');
    document.getElementById('tool_laser').dataset['n'] = i18nTranslate('toolname_laser');

    //Point source
    document.getElementById('tool_radiant').value = i18nTranslate('toolname_radiant');
    document.getElementById('tool_radiant').dataset['n'] = i18nTranslate('toolname_radiant');
    document.getElementById('tool_radiant').dataset['p'] = i18nTranslate('brightness');

    //Beam
    document.getElementById('tool_parallel').value = i18nTranslate('toolname_parallel');
    document.getElementById('tool_parallel').dataset['n'] = i18nTranslate('toolname_parallel');
    document.getElementById('tool_parallel').dataset['p'] = i18nTranslate('brightness');

    //Mirror▼
    document.getElementById('tool_mirror_').value = i18nTranslate('toolname_mirror_') + downarraw;

    //Mirror->Line
    document.getElementById('tool_mirror').value = i18nTranslate('tooltitle_mirror');
    document.getElementById('tool_mirror').dataset['n'] = i18nTranslate('toolname_mirror_');

    //Mirror->Circular Arc
    document.getElementById('tool_arcmirror').value = i18nTranslate('tooltitle_arcmirror');
    document.getElementById('tool_arcmirror').dataset['n'] = i18nTranslate('toolname_mirror_');

    //Mirror->Curve (ideal)
    document.getElementById('tool_idealmirror').value = i18nTranslate('tooltitle_idealmirror');
    document.getElementById('tool_idealmirror').dataset['n'] = i18nTranslate('toolname_idealmirror');
    document.getElementById('tool_idealmirror').dataset['p'] = i18nTranslate('focallength');

    //Refractor▼
    document.getElementById('tool_refractor_').value = i18nTranslate('toolname_refractor_') + downarraw;

    //Refractor->Half-plane
    document.getElementById('tool_halfplane').value = i18nTranslate('tooltitle_halfplane');
    document.getElementById('tool_halfplane').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_halfplane').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Circle
    document.getElementById('tool_circlelens').value = i18nTranslate('tooltitle_circlelens');
    document.getElementById('tool_circlelens').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_circlelens').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Other shape
    document.getElementById('tool_refractor').value = i18nTranslate('tooltitle_refractor');
    document.getElementById('tool_refractor').dataset['n'] = i18nTranslate('toolname_refractor_');
    document.getElementById('tool_refractor').dataset['p'] = i18nTranslate('refractiveindex');

    //Refractor->Lens (ideal)
    document.getElementById('tool_lens').value = i18nTranslate('tooltitle_lens');
    document.getElementById('tool_lens').dataset['n'] = i18nTranslate('toolname_lens');
    document.getElementById('tool_lens').dataset['p'] = i18nTranslate('focallength');

    //Blocker
    document.getElementById('tool_blackline').value = i18nTranslate('toolname_blackline');
    document.getElementById('tool_blackline').dataset['n'] = i18nTranslate('toolname_blackline');

    //Ruler
    document.getElementById('tool_ruler').value = i18nTranslate('toolname_ruler');
    document.getElementById('tool_ruler').dataset['n'] = i18nTranslate('toolname_ruler');

    //Protractor
    document.getElementById('tool_protractor').value = i18nTranslate('toolname_protractor');
    document.getElementById('tool_protractor').dataset['n'] = i18nTranslate('toolname_protractor');

    //Move view
    document.getElementById('tool_').value = i18nTranslate('toolname_');

    // Mode bar
    document.getElementById('modebar_title').innerHTML = i18nTranslate('modebar_title');
    document.getElementById('mode_light').value = i18nTranslate('modename_light');
    document.getElementById('mode_extended_light').value = i18nTranslate('modename_extended_light');
    document.getElementById('mode_images').value = i18nTranslate('modename_images');
    document.getElementById('mode_observer').value = i18nTranslate('modename_observer');
    document.getElementById('rayDensity_title').innerHTML = i18nTranslate('raydensity');

    document.getElementById('undo').value = i18nTranslate('undo');
    document.getElementById('redo').value = i18nTranslate('redo');
    document.getElementById('reset').value = i18nTranslate('reset');
    document.getElementById('save').value = i18nTranslate('save');
    document.getElementById('save_name_title').innerHTML = i18nTranslate('save_name');
    document.getElementById('save_confirm').value = i18nTranslate('save');
    document.getElementById('save_cancel').value = i18nTranslate('save_cancel');
    document.getElementById('save_description').innerHTML = i18nTranslate('save_description');
    document.getElementById('open').value = i18nTranslate('open');
    document.getElementById('lockobjs_title').innerHTML = i18nTranslate('lockobjs');
    document.getElementById('grid_title').innerHTML = i18nTranslate('snaptogrid');
    document.getElementById('showgrid_title').innerHTML = i18nTranslate('grid');

    document.getElementById('setAttrAll_title').innerHTML = i18nTranslate('applytoall');
    document.getElementById('copy').value = i18nTranslate('duplicate');
    document.getElementById('delete').value = i18nTranslate('delete');

    document.getElementById('forceStop').innerHTML = i18nTranslate('processing');

    document.getElementById('footer_message').innerHTML = i18nTranslate('footer_message');
    document.getElementById('homepage').innerHTML = i18nTranslate('homepage');
    document.getElementById('source').innerHTML = i18nTranslate('source');
}