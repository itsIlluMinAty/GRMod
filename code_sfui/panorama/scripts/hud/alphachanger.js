function alphachanger() {
	var weaponpanelopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('weaponpanelbgcenter')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.006633802816901)
	var radarpanelopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-centertop')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.006633802816901)
	var healthpanelopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-HA-bg-center')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.006633802816901)
	var healthbghpanelopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-HA-bg-h')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.006633802816901)
	var moneypanelopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('money-text-bg')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha"))
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) > 0.001) {
			var weaponpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('weaponpanelbgcenterborder')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.655633802816901)
		}
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) < 0.001) {
		var weaponpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('weaponpanelbgcenterborder')[0].style.opacity = '0')
		}
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) > 0.001) {
			var radarpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-centertop-border')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.655633802816901)
		}
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) < 0.001) {
		var radarpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-centertop-border')[0].style.opacity = '0')
		}
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) > 0.001) {
			var healthpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-HA-bg-center-border')[0].style.opacity = GameInterfaceAPI.GetSettingString("cl_hud_background_alpha") * 1.655633802816901)
		}
		
		if (GameInterfaceAPI.GetSettingString( "cl_hud_background_alpha" ) < 0.001) {
		var healthpanelborderopacity = ($.GetContextPanel().FindChildrenWithClassTraverse('hud-HA-bg-center-border')[0].style.opacity = '0')
	}
}

function scaleHud() {
	var actualx = $.GetContextPanel().actualuiscale_x;
	var actualy = $.GetContextPanel().actualuiscale_y;
	var actual_scalex = $.GetContextPanel().actualxoffset;
	var actual_scaley = $.GetContextPanel().actualyoffset;
	
	
	var screenWidth = $.GetContextPanel().actualuiscale_x;
	var screenHeight = $.GetContextPanel().actualuiscale_y;
	var scale = Math.min(screenWidth / 1920, screenHeight / 1080);
	var minScale = 1.2;
	var scaledValue = Math.max(scale, minScale);

	var hudParentScaling = $('#Hud')
	hudParentScaling.style.uiScale = GameInterfaceAPI.GetSettingString("hud_scaling") * 100 * scaledValue + '%';
	hudParentScaling.style.zIndex = 100;
}

function updateAlpha() {
	scaleHud();
	alphachanger();
    $.Schedule((1 / 95000000 || 0), updateAlpha);
}

$.Schedule((1 / 95000000 || 0), updateAlpha);
