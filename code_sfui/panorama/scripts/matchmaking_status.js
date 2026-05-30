'use strict';

                                                     
                                                                    
                                    
                                                     


function MatchmakingStatus( elMatchStatus )
{
	var _m_searchTimeUpdateHandle = false;
	var _m_ShowPopupHandle = false;
	var _m_elStatusPanel = elMatchStatus;
	var _handler_MatchmakingSessionUpdate,
		_handler_GC_Hello,
		_handler_HideMainMenu,
		_handler_HidePauseMenu,
		_handler_ShowPauseMenu,
		_handler_ShowMainMenu;
	
	var _m_showMatchingMissions = true;

	var _BCanShow = function()
	{
		if ( _m_elStatusPanel.GetAttributeString( 'data-type', '' ) === 'hud' )
		{
			var mode = GameStateAPI.GetGameModeInternalName( false );
			if ( mode === 'survival' )
			{
				var teamCount = Number( GameInterfaceAPI.GetSettingString( 'sv_dz_team_count' ) );
				if ( teamCount > 1 )
					return false;                                                                                  
				else
					return true;                                                                              
			}
			else
			{	                                                    
				return false;
			}
		}

		                                         
		return true;
	}

	var _Init = function()
	{
		_UpdateMatchmakingStatus();
		_handler_MatchmakingSessionUpdate = $.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionUpdate );
		
		                                                                                                                             
		_handler_GC_Hello = $.RegisterForUnhandledEvent( 'PanoramaComponent_GC_Hello', _SessionUpdate );
	
		                                                                                                                               
		_handler_HideMainMenu = $.RegisterForUnhandledEvent( "CSGOHideMainMenu", _OnHideMainMenu );
		_handler_HidePauseMenu = $.RegisterForUnhandledEvent( "CSGOHidePauseMenu", _OnHidePauseMenu );
		_handler_ShowPauseMenu = $.RegisterForUnhandledEvent( "CSGOShowPauseMenu", _OnShowMenu );
		_handler_ShowMainMenu = $.RegisterForUnhandledEvent( "CSGOShowMainMenu", _OnShowMenu );
	};

	var _Shutdown = function()
	{
		$.UnregisterForUnhandledEvent( 'PanoramaComponent_Lobby_MatchmakingSessionUpdate', _handler_MatchmakingSessionUpdate );
		$.UnregisterForUnhandledEvent( 'PanoramaComponent_GC_Hello', _handler_GC_Hello );
		$.UnregisterForUnhandledEvent( "CSGOHideMainMenu", _handler_HideMainMenu );
		$.UnregisterForUnhandledEvent( "CSGOHidePauseMenu", _handler_HidePauseMenu );
		$.UnregisterForUnhandledEvent( "CSGOShowPauseMenu", _handler_ShowPauseMenu );
		$.UnregisterForUnhandledEvent( "CSGOShowMainMenu", _handler_ShowMainMenu );
	};

	var _SessionUpdate = function()
	{
		if ( !_m_elStatusPanel || !_m_elStatusPanel.IsValid() )
			return;
		
		_UpdateMatchmakingStatus();
	};

	var _UpdateMatchmakingStatus = function()
	{
		var lobbySettings = LobbyAPI.GetSessionSettings().game;

		if ( !LobbyAPI.IsSessionActive() || !_BCanShow() )
		{
			_m_elStatusPanel.SetHasClass( 'hidden', true );
			return;
		}

		_m_elStatusPanel.SetHasClass( 'hidden', false );

		_UpdateStatusPanel( lobbySettings );
	};

	var _UpdateStatusPanel = function( lobbySettings )
	{
		_CancelSearchTimeUpdate();

		_UpdateSearchWaitPanel( lobbySettings );
		_SearchPanelSearching( lobbySettings );
		_ShowMatchmakingWarnings( lobbySettings );
		_CheckForMatchingMissions( lobbySettings );
	};

	var _UpdateSearchWaitPanel = function( lobbySettings )
	{
		var elStatusWait = _m_elStatusPanel.FindChildInLayoutFile( 'MatchStatusWait' );

		if ( !lobbySettings || _IsHost() || _IsSeaching() )
		{
			elStatusWait.AddClass( 'hidden' );
			return;
		}

		elStatusWait.RemoveClass( 'hidden' );
		elStatusWait.FindChildInLayoutFile( 'MatchStatusWaitLabel' ).text = $.Localize( "#party_waiting_lobby_leader" );
	};

	var _SearchPanelSearching = function( lobbySettings )
	{
		var elStatusSearching = _m_elStatusPanel.FindChildInLayoutFile( 'MatchStatusSearching' );

		if ( !lobbySettings || !_IsSeaching() )
		{
			elStatusSearching.AddClass( 'hidden' );
			_m_showMatchingMissions = true;
			_CancelSearchTimeUpdate();
			return;
		}

		elStatusSearching.RemoveClass( 'hidden' );
		var unavailableMatch = _GetSearchStatus().indexOf( 'unavailable' ) !== -1 ? true : false;

		var elWarningIcon = elStatusSearching.FindChildInLayoutFile( 'MatchStatusFailIcon' );
		elWarningIcon.SetHasClass( 'hidden', !unavailableMatch );

		var elSearchTime = elStatusSearching.FindChildInLayoutFile( 'MatchStatusTime' );
		elSearchTime.SetHasClass( 'hidden', unavailableMatch );

		var elLabel= elStatusSearching.FindChildInLayoutFile( 'MatchStatusSearchingLabel' );
		elLabel.text = $.Localize( _GetSearchStatus() );

		if ( unavailableMatch )
			return;
		
		_UpdateSearchTime();
	};

	var _ShowMatchmakingWarnings = function( lobbySettings )
	{
		var elStatusWarnings = _m_elStatusPanel.FindChildInLayoutFile( 'MatchStatusWarning' );

		if ( !lobbySettings || !_IsSeaching() )
		{
			elStatusWarnings.AddClass( 'hidden' );
			return;
		}
		
		                  
		elStatusWarnings.RemoveClass( 'hidden' );
		var serverWarning = NewsAPI.GetCurrentActiveAlertForUser();
		var isWarning = serverWarning !== '' && serverWarning !== undefined ? true : false;

		elStatusWarnings.SetHasClass( 'hidden', !isWarning );
		if( isWarning )
			elStatusWarnings.FindChild( 'MatchStatusWarningLabel' ).text = $.Localize( serverWarning );
	};

	var _CheckForMatchingMissions = function( lobbySettings )
	{
		var nSeasonAccess = GameTypesAPI.GetActiveSeasionIndexValue();
		if ( nSeasonAccess < 0 || nSeasonAccess === null )
		{
			return;
		}
		
		if ( _IsSeaching() && lobbySettings && lobbySettings.mapgroupname && _m_showMatchingMissions )
		{
			OperationUtil.MissionsThatMatchYourMatchMakingSettings( lobbySettings.mode, lobbySettings.mapgroupname.split( ',' ), nSeasonAccess );
			_m_showMatchingMissions = false;
		}
	};

	                                                                                                    
	                          
	                                                                                                    
	var _IsHost = function()
	{
		return LobbyAPI.BIsHost();
	};

	var _GetSearchStatus = function()
	{
		return LobbyAPI.GetMatchmakingStatusString();
	};

	function _IsSeaching()
	{
		var searchingStatus = GameInterfaceAPI.GetSettingString( 'suprem_matchmaking_search_status');
		return searchingStatus !== 'notsearching' && searchingStatus !== '' && searchingStatus !== undefined ? true : false;
	};

	var connectingIp = '';
	                                                                                                  
	var _UpdateSearchTime = function()
	{
		var secondsString = GameInterfaceAPI.GetSettingString( 'suprem_matchmaking_search_time');
		var seconds = parseInt(secondsString) + 1;
		var elSearchTime = _m_elStatusPanel.FindChildInLayoutFile( 'MatchStatusTime' )
		GameInterfaceAPI.SetSettingString( 'suprem_matchmaking_search_time', seconds.toString());
		elSearchTime.text = FormatText.SecondsToDDHHMMSSWithSymbolSeperator( seconds.toString() );

		var searchingStatus = GameInterfaceAPI.GetSettingString( 'suprem_matchmaking_search_status');
		
		if(searchingStatus.indexOf('matchfound') !== -1)
		{
			var parts = searchingStatus.split(" ");

			connectingIp = parts[2];
			$.Schedule( 1.0, _PlayLetsRoll );
			$.Schedule( 3.5, _ConnectToServer );
			_m_searchTimeUpdateHandle = $.Schedule( 30.0, _UpdateSearchTime );
			_ShowMatchAcceptPopUp(parts[1]);
			GameInterfaceAPI.SetSettingString( 'suprem_matchmaking_search_status', 'notsearching' );
			$.DispatchEvent('PanoramaComponent_Lobby_MatchmakingSessionUpdate', 'updated');
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.popup_accept_match_found', 'MOUSE' );
			//suprem_matchmaking_search_status "matchfound de_nuke 79.193.126.39"
		}
		else
		{
			_m_searchTimeUpdateHandle = $.Schedule( 1.0, _UpdateSearchTime );
		}
	};

	var _PlayLetsRoll = function()
	{
		$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.popup_accept_match_confirmed', 'MOUSE' );
	} 

	var _ConnectToServer = function()
	{
		if(connectingIp == '')
		{
			return;
		}

		GameInterfaceAPI.SetSettingString( 'suprem_matchmaking_search_status', 'notsearching' );
		$.DispatchEvent( "PanoramaComponent_Lobby_ReadyUpForMatch", false, 1, 1 );
		GameInterfaceAPI.ConsoleCommand('connect ' + connectingIp);
		connectingIp = '';
	} 

	var _CancelSearchTimeUpdate = function()
	{
		if ( _m_searchTimeUpdateHandle !== false )
		{
			$.CancelScheduled( _m_searchTimeUpdateHandle );
			_m_searchTimeUpdateHandle = false;
		}
	};

	var _CancelSearchTimeUpdate = function()
	{
		if ( _m_searchTimeUpdateHandle !== false )
		{
			$.CancelScheduled( _m_searchTimeUpdateHandle );
			_m_searchTimeUpdateHandle = false;
		}
	};

	var _OnHideMainMenu = function()
	{
		_CancelSearchTimeUpdate();
	};

	var _OnHidePauseMenu = function()
	{
		_CancelSearchTimeUpdate();
	};

	var _OnShowMenu = function()
	{
		_UpdateMatchmakingStatus();
	};

	var _ShowMatchAcceptPopUp = function( map )
	{
		var popup = UiToolkitAPI.ShowGlobalCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_accept_match.xml', 'map_and_isreconnect=' + map + ',false' );
		$.DispatchEvent( "ShowAcceptPopup", popup );
	};

	return {
		Init: _Init,
		Shutdown: _Shutdown
	};
}

( function()
{
	var elMatchStatus = $.GetContextPanel();
	elMatchStatus.matchStatus = new MatchmakingStatus( elMatchStatus );
	elMatchStatus.matchStatus.Init();
})();
