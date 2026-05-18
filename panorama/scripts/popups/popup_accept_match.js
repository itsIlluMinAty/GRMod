'use strict';


var PopupAcceptMatch = ( function(){

	var m_hasPressedAccept = false;
	var m_numPlayersReady = 0;
	var m_numTotalClientsInReservation = 0;
	var m_numRequiredAccepts = 0;
	var m_numSecondsRemaining = 0;
	var m_isReconnect= false;
	var m_isManualMode = false;
	var m_isNqmmAnnouncementOnly = false;
	var m_hasReadyEvent = false;
	var m_hasPlayedCloseSound = false;
	var m_hasSentManualDecision = false;
	var m_lobbySettings;
	var m_elTimer = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchCountdown' );
	var m_jsTimerUpdateHandle = false;
	var m_jsDelayedCloseHandle = false;
	var kManualCloseDelay = 0.85;
	var kDeferredConnectAfterPersonDelay = 0.1;
	var kMainMenuReconnectPopupSetting = 'ui_mainmenu_accept_popup_reconnect';

	var _SetMainMenuReconnectPopupState = function( active )
	{
		GameInterfaceAPI.SetSettingString( kMainMenuReconnectPopupSetting, active ? '1' : '0' );
	};

	var _RunDeferredConnect = function()
	{
		if ( !m_isManualMode )
		{
			_FinalizePopupClose();
			return;
		}

		$.Schedule( kDeferredConnectAfterPersonDelay, function()
		{
			GameInterfaceAPI.SetSettingString( 'ui_manual_connect_started', '1' );
			GameInterfaceAPI.ConsoleCommand( 'mm_deferred_accept_connect' );
			LobbyAPI.StopMatchmaking();
			if ( LobbyAPI.IsSessionActive() )
			{
				LobbyAPI.CloseSession();
			}
			_FinalizePopupClose();
		} );
	}

	var _SendManualDecision = function( accepted )
	{
		if ( !m_isManualMode || m_hasSentManualDecision || m_isNqmmAnnouncementOnly )
		{
			return;
		}

		m_hasSentManualDecision = true;
		GameInterfaceAPI.ConsoleCommand( accepted ? 'mm_queue_accept' : 'mm_queue_decline' );
	}

	var _FinalizePopupClose = function()
	{
		_SetMainMenuReconnectPopupState( false );
		m_jsDelayedCloseHandle = false;
		$.DispatchEvent( 'UIPopupButtonClicked', '' );
	}

	var _RequestPopupClose = function( playConfirmedSound )
	{
		if ( playConfirmedSound )
		{
			_PlayConfirmedCloseSound();
		}

		$.DispatchEvent( 'CloseAcceptPopup' );

		if ( m_isManualMode && playConfirmedSound )
		{
			if ( !m_jsDelayedCloseHandle )
			{
				m_jsDelayedCloseHandle = $.Schedule( kManualCloseDelay, _RunDeferredConnect );
			}
			return;
		}

		_FinalizePopupClose();
	}

	var _PlayConfirmedCloseSound = function()
	{
		if ( m_hasPlayedCloseSound )
		{
			return;
		}

		m_hasPlayedCloseSound = true;
		$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_confirmed', 'MOUSE' );
	}

	var _ShouldUseAnnouncementOnlyMode = function()
	{
		if ( $.GetContextPanel().GetAttributeString( 'manual_announcement', 'false' ) === 'true' )
		{
			return true;
		}

		var mode = $.GetContextPanel().GetAttributeString( 'manual_mode', '' );
		if ( !mode && m_lobbySettings && m_lobbySettings.game )
		{
			mode = m_lobbySettings.game.mode || '';
		}

		return mode === 'casual' || mode === 'deathmatch' || mode === 'skirmish';
	}

	          
	                    
	          
	
	var _Init = function ()
	{
		m_hasPlayedCloseSound = false;
		m_hasPressedAccept = false;
		m_hasReadyEvent = false;
		m_isNqmmAnnouncementOnly = false;
		m_hasSentManualDecision = false;
		if ( m_jsDelayedCloseHandle )
		{
			$.CancelScheduled( m_jsDelayedCloseHandle );
			m_jsDelayedCloseHandle = false;
		}
		$.GetContextPanel().RemoveClass( 'Hidden' );
		$.GetContextPanel().visible = true;

		               
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchSlots' );
		elPlayerSlots.RemoveAndDeleteChildren();
		
		var settings = $.GetContextPanel().GetAttributeString( 'map_and_isreconnect', '' );
		m_isManualMode = $.GetContextPanel().GetAttributeString( 'manual', 'false' ) === 'true';

		                                           
		var settingsList = settings.split( ',' );

		var map = $.GetContextPanel().GetAttributeString( 'manual_map', settingsList[ 0 ] );
		if ( map.charAt( 0 ) === '@' )
		{
			m_isNqmmAnnouncementOnly = true;
			m_hasPressedAccept = true;
			map = map.substr( 1 );
		}
		
		                                                             
		m_isReconnect = settingsList[ 1 ] === 'true' ? true : false;
		m_lobbySettings = LobbyAPI.GetSessionSettings();
		$.GetContextPanel().SetHasClass( 'accept-match--competitive-layout', _IsCompetitiveOrWingman() );
		$( '#id-accept-match' ).SetHasClass( 'accept-match--competitive-layout', _IsCompetitiveOrWingman() );
		_SetMainMenuReconnectPopupState( _IsCompetitiveOrWingman() );
		if ( _ShouldUseAnnouncementOnlyMode() )
		{
			m_isNqmmAnnouncementOnly = true;
			m_hasPressedAccept = true;
		}

		if ( m_isManualMode )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_beep', 'MOUSE' );
		}

		          
		              
		 
			                                 
			                          
			                      
		 
		          

		if ( !m_isReconnect && m_lobbySettings && m_lobbySettings.game  )
		{
			                         
			var elAgreement = $.GetContextPanel().FindChildInLayoutFile( 'Agreement' );
			var elAgreementComp = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchAgreementCompetitive' );

			if ( _IsCompetitiveOrWingman() )
			{
				// Hide agreement and warning for competitive/wingman
				elAgreement.visible = false;
				var elWarning = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchWarning' );
				if ( elWarning ) elWarning.AddClass( 'hidden' );
			}
			else
			{
				elAgreement.visible = true;
				elAgreementComp.visible = ( m_lobbySettings.game.mode === "competitive" );
			}
		}

		if ( !m_isManualMode )
		{
			$.DispatchEvent( "ShowReadyUpPanel", "" );
		}

		_SetMatchData( map );

		if ( m_isManualMode )
		{
			$( '#AcceptMatchDataContainer' ).SetHasClass( 'auto', true );
			_ApplyManualReadyState();
		}

		if ( m_isNqmmAnnouncementOnly )
		{
			$( '#AcceptMatchDataContainer' ).SetHasClass( 'auto', true );
			var elAgreement = $.GetContextPanel().FindChildInLayoutFile( 'Agreement' );
			if ( elAgreement )
			{
				elAgreement.visible = false;
			}
			_UpdateUiState();
			m_jsTimerUpdateHandle = $.Schedule( 1.9, _OnNqmmAutoReadyUp );
		}

		_PopulatePlayerList();
	}

	function _PopulatePlayerList()
	{
		                                         

		var numPlayers = LobbyAPI.GetConfirmedMatchPlayerCount();
		          
		              
		 
			                
			                              
			                 
		 
		          
		if ( !numPlayers || numPlayers <= 2 )
			return;

		$.GetContextPanel().SetHasClass( "accept-match-with-player-list", true );

		$.GetContextPanel().FindChildInLayoutFile( 'id-map-draft-phase-teams' ).RemoveClass( 'hidden' );
		
		var iYourXuidTeamIdx = 0;
		var yourXuid = MyPersonaAPI.GetXuid();
		                                                
		for ( var i = 0; i < numPlayers; ++ i )
		{
			var xuidPlayer = LobbyAPI.GetConfirmedMatchPlayerByIdx( i );
			if ( xuidPlayer && xuidPlayer === yourXuid )
			iYourXuidTeamIdx = ( i < (numPlayers/2) ) ? 0 : 1;
		}
		
		                                                            
		for ( var i = 0; i < numPlayers; ++ i )
		{
			var xuid = LobbyAPI.GetConfirmedMatchPlayerByIdx( i );
			if ( !xuid )
			{
				          
				              
					                
				    
				          
				continue;
			}

			                                                                   
			var iThisPlayerTeamIdx = ( i < (numPlayers/2) ) ? 0 : 1;
			var teamPanelId = ( iYourXuidTeamIdx === iThisPlayerTeamIdx ) ? 'id-map-draft-phase-your-team' : 'id-map-draft-phase-other-team';
			var elTeammates = $.GetContextPanel().FindChildInLayoutFile( teamPanelId ).FindChild( 'id-map-draft-phase-avatars' );
			_MakeAvatar( xuid, elTeammates, true );
		}
	}

	var _ApplyManualReadyState = function()
	{
		m_numPlayersReady = 0;
		m_numTotalClientsInReservation = _GetManualReservationSize();
		m_numRequiredAccepts = m_numTotalClientsInReservation;
		m_numSecondsRemaining = _GetManualCountdownSeconds();
		_UpdateUiState();
		m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
	}

	var _IsCompetitiveOrWingman = function()
	{
		var mode = $.GetContextPanel().GetAttributeString( 'manual_mode', '' );
		if ( !mode && m_lobbySettings && m_lobbySettings.game )
		{
			mode = m_lobbySettings.game.mode || m_lobbySettings.game.game_mode || '';
		}

		mode = ( '' + mode ).toLowerCase();
		if ( mode === '8' || mode === '10' || mode === '13' )
		{
			return true;
		}

		return mode === 'competitive'
			|| mode === 'wingman'
			|| mode === 'survival'
			|| mode === 'dangerzone'
			|| mode === 'scrimcomp2v2'
			|| mode.indexOf( 'competitive' ) !== -1
			|| mode.indexOf( 'wingman' ) !== -1
			|| mode.indexOf( 'survival' ) !== -1
			|| mode.indexOf( 'dangerzone' ) !== -1
			|| mode.indexOf( 'scrimcomp2v2' ) !== -1;
	}

	var _GetManualReservationSize = function()
	{
		var mode = $.GetContextPanel().GetAttributeString( 'manual_mode', '' );
		if ( !mode && m_lobbySettings && m_lobbySettings.game )
		{
			mode = m_lobbySettings.game.mode || '';
		}

		if ( mode === 'competitive' )
			return 10;
		if ( mode === 'scrimcomp2v2' )
			return 4;

		if ( m_lobbySettings && m_lobbySettings.game )
		{
			var maxLobbySlots = SessionUtil.GetMaxLobbySlotsForGameMode( m_lobbySettings.game.mode );
			if ( maxLobbySlots > 0 )
			{
				return maxLobbySlots;
			}
		}

		return 10;
	}

	var _GetManualCountdownSeconds = function()
	{
		if ( _IsCompetitiveOrWingman() )
			return 10;
		return 2;
	}

	var _MakeAvatar = function( xuid, elTeammates, bisTeamLister = false )
	{
		var panelType = bisTeamLister ? 'Button' : 'Panel';
		var elAvatar = $.CreatePanel( panelType, elTeammates, xuid );
		elAvatar.BLoadLayoutSnippet( 'SmallAvatar' );

		if(bisTeamLister )
		{
			_AddOpenPlayerCardAction( elAvatar, xuid );
		}

		elAvatar.FindChildTraverse('JsAvatarImage').steamid = xuid;
		var elTeamColor = elAvatar.FindChildInLayoutFile( 'JsAvatarTeamColor' );
		elTeamColor.visible = false;

		var strName = FriendsListAPI.GetFriendName( xuid );
		                                                                  
		elAvatar.SetDialogVariable( 'teammate_name', strName );
	}

	var _AddOpenPlayerCardAction = function ( elAvatar, xuid ) {
		var openCard = function ( xuid )
		{
			                                                                                             
			$.DispatchEvent( 'SidebarContextMenuActive', true );
			
			if ( xuid !== 0 ) {
				var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
					'',
					'',
					'file://{resources}/layout/context_menus/context_menu_playercard.xml', 
					'xuid='+xuid,
					function () {
						$.DispatchEvent('SidebarContextMenuActive', false )
					}
				);
				contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
			}
		}

		elAvatar.SetPanelEvent( "onactivate", openCard.bind( undefined, xuid ));
	};

	var _UpdateUiState = function()
	{
		var btnAccept = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchBtn' );
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchSlots' );
		var labelPlayersAccepted = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchPlayersAccepted' );
		var labelConnecting = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchConnecting' );

		var bHideTimer = false;
		var bShowPlayerSlots = m_hasPressedAccept || m_isReconnect;
		var showConnectingLabel = m_isManualMode && m_hasPressedAccept && !m_isNqmmAnnouncementOnly;
		if ( m_isNqmmAnnouncementOnly )
		{
			bShowPlayerSlots = false;
			bHideTimer = true;
		}

		if ( showConnectingLabel )
		{
			bShowPlayerSlots = false;
			bHideTimer = true;
		}
		
		btnAccept.SetHasClass( 'hidden', m_hasPressedAccept || m_isReconnect );
		elPlayerSlots.SetHasClass( 'hidden', !bShowPlayerSlots );
		labelConnecting.SetHasClass( 'hidden', !showConnectingLabel );

		if ( bShowPlayerSlots )
		{
			_UpdatePlayerSlots( elPlayerSlots );
			bHideTimer = true;
		}

		if ( showConnectingLabel )
		{
			labelPlayersAccepted.text = '';
		}
		else if ( m_isNqmmAnnouncementOnly )
		{
			labelPlayersAccepted.text = '';
		}

		var minutesRemaining = Math.floor( m_numSecondsRemaining / 60 );
		var secondsRemaining = m_numSecondsRemaining % 60;
		m_elTimer.GetChild(0).text = 'YOU WILL AUTOMATICALLY CONNECT IN ' + minutesRemaining + ':' + ( (secondsRemaining < 10) ? '0' : '' ) + secondsRemaining + '';
		m_elTimer.SetHasClass( "hidden", bHideTimer || ( m_numSecondsRemaining <= 0 ) );
	}

	var _UpdateTimeRemainingSeconds = function()
	{
		if ( m_isManualMode )
		{
			if ( m_numSecondsRemaining > 0 )
			{
				m_numSecondsRemaining = m_numSecondsRemaining - 1;
			}
			return;
		}

		m_numSecondsRemaining = LobbyAPI.GetReadyTimeRemainingSeconds();
		          
		              
			                           
		          
	}

	var _OnTimerUpdate = function()
	{
		m_jsTimerUpdateHandle = false;

		_UpdateTimeRemainingSeconds();
		_UpdateUiState();

		if ( m_numSecondsRemaining > 0 )
		{
			if ( m_hasPressedAccept )
			{
				$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_waitquiet', 'MOUSE' );
			}
			else
			{
				$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_beep', 'MOUSE' );
			}

			m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
			return;
		}

		if ( m_isManualMode && !m_hasReadyEvent )
		{
			if ( _IsCompetitiveOrWingman() && !m_hasPressedAccept )
			{
				_OnAcceptMatchPressed();
			}
			else
			{
				_RequestPopupClose( true );
			}
		}
	}

	var _FriendsListNameChanged = function ( xuid )
	{
		                                            
		if ( !xuid ) return;
		var elNameLabel = $.GetContextPanel().FindChildTraverse( 'xuid' );
		if ( !elNameLabel ) return;
		
		var strName = FriendsListAPI.GetFriendName( xuid );
		                                                              
		elNameLabel.SetDialogVariable( 'teammate_name', strName );
	}

	var _ReadyForMatch = function ( shouldShow, playersReadyCount, numTotalClientsInReservation )
	{
		m_hasReadyEvent = true;

		if ( m_isManualMode )
		{
			if ( !shouldShow )
			{
				return;
			}

			if ( m_hasPressedAccept && m_numPlayersReady && ( playersReadyCount > m_numPlayersReady ) )
			{
				$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
			}

			m_numPlayersReady = playersReadyCount;
			if ( numTotalClientsInReservation > 0 )
			{
				m_numRequiredAccepts = numTotalClientsInReservation;
			}

			_UpdateUiState();

			if ( m_numRequiredAccepts > 0 && m_numPlayersReady >= m_numRequiredAccepts )
			{
				$.Schedule( 0.5, function() { _RequestPopupClose( true ); } );
			}

			return;
		}

		if( !shouldShow )
		{
			if( m_jsTimerUpdateHandle )
			{
				$.CancelScheduled( m_jsTimerUpdateHandle );
				m_jsTimerUpdateHandle = false;
			}

			_RequestPopupClose( true );
			return;
		}

		if ( m_hasPressedAccept && m_numPlayersReady && ( playersReadyCount > m_numPlayersReady ) )
		{
			                                                                                               
			$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
		}

		if ( playersReadyCount == 1 && numTotalClientsInReservation == 1 && ( m_numTotalClientsInReservation > 1 ) )
		{	                                                                                 
			                                                                          
			numTotalClientsInReservation = m_numTotalClientsInReservation;
			playersReadyCount = m_numTotalClientsInReservation;
		}
		m_numPlayersReady = playersReadyCount;
		m_numTotalClientsInReservation = numTotalClientsInReservation;
		_UpdateTimeRemainingSeconds();
		_UpdateUiState();

		m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
	}

	var _UpdatePlayerSlots = function ( elPlayerSlots )
	{
		          
		              
		 
			                                    
			                      
		 
		          

		for( var i = 0; i < m_numTotalClientsInReservation; i++ )
		{
			var Slot = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchSlot' + i );

			if( !Slot )
			{
				Slot = $.CreatePanel( 'Panel', elPlayerSlots, 'AcceptMatchSlot' + i );
				Slot.BLoadLayoutSnippet( 'AcceptMatchPlayerSlot' );
			}

			Slot.SetHasClass ( 'accept-match__slots__player--accepted', ( i < m_numPlayersReady ) );
		}

		var labelPlayersAccepted = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchPlayersAccepted' );
		labelPlayersAccepted.SetDialogVariableInt( 'accepted', m_numPlayersReady );
		labelPlayersAccepted.SetDialogVariableInt( 'slots', m_numTotalClientsInReservation );
		labelPlayersAccepted.text = $.Localize( '#match_ready_players_accepted', labelPlayersAccepted );
	}

	                                                                                             
	var _SetMatchData = function ( map )
	{
		var gameSettings = m_lobbySettings && m_lobbySettings.game ? m_lobbySettings.game : null;
		if ( !gameSettings && !m_isManualMode )
			return;

		var labelData = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchModeMap' );
		var strLocalize = '#match_ready_match_data';
		var manualMode = $.GetContextPanel().GetAttributeString( 'manual_mode', '' );
		var manualGroupLabel = $.GetContextPanel().GetAttributeString( 'manual_group_label', '' );
		manualGroupLabel = manualGroupLabel ? decodeURIComponent( manualGroupLabel ) : '';
		var manualImageMap = $.GetContextPanel().GetAttributeString( 'manual_image_map', map );
		var mode = gameSettings ? gameSettings.mode : manualMode;

		                                                                                                                                                      
		
		labelData.SetDialogVariable( 'mode', $.Localize( '#SFUI_GameMode_' + mode ) );

		                                    
		                                                          
		   	                                                                                     
		    
		   	                                                                                         
		   	                                                                                                
		   	                                                    
		   	                                                                                          
		    

		var flags = gameSettings ? parseInt( gameSettings.gamemodeflags ) : 0;

		if ( gameSettings && GameModeFlags.DoesModeUseFlags( gameSettings.mode ) && flags )
		{
			labelData.SetDialogVariable( 'modifier', $.Localize( '#play_setting_gamemodeflags_' + gameSettings.mode + '_' + flags ) );
			strLocalize = '#match_ready_match_data_modifier';
		}

		if ( (!_IsCompetitiveOrWingman() && gameSettings && MyPersonaAPI.GetElevatedState() === 'elevated' && SessionUtil.DoesGameModeHavePrimeQueue( gameSettings.mode ) && ( gameSettings.prime !== 1 || !SessionUtil.AreLobbyPlayersPrime() )))
		{
			$.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchWarning' ).RemoveClass( 'hidden' );
		}

		labelData.SetDialogVariable ( 'map', manualGroupLabel || $.Localize( '#SFUI_Map_' + map ) );
		if ( manualGroupLabel )
		{
			strLocalize = '#match_ready_match_data_map';
		}

		if ( gameSettings && ( gameSettings.mode === 'competitive' ) && ( map === 'lobby_mapveto' ) )
		{
			$('#AcceptMatchModeIcon').SetImage( "file://{images}/icons/ui/competitive_teams.svg" );

			if ( m_lobbySettings.options && m_lobbySettings.options.challengekey )
			{
				                                                                 
				strLocalize = '#match_ready_match_data_map';
				labelData.SetDialogVariable ( 'map', $.Localize( '#SFUI_Lobby_LeaderMatchmaking_Type_PremierPrivateQueue' ) );
			}
		}

		labelData.text = $.Localize( strLocalize, labelData );

		var imgMap = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchMapImage' );		
		imgMap.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + manualImageMap + '.png")';
	}

	var _OnNqmmAutoReadyUp = function ()
	{
		m_jsTimerUpdateHandle = false;
		LobbyAPI.SetLocalPlayerReady( 'deferred' );
		_RequestPopupClose( true );
	}

	var _OnCloseAcceptPopup = function ()
	{
		_SetMainMenuReconnectPopupState( false );
		if ( m_isManualMode && ( m_hasPressedAccept || m_isNqmmAnnouncementOnly || m_hasReadyEvent ) )
		{
			_PlayConfirmedCloseSound();
			if ( !m_jsDelayedCloseHandle )
			{
				m_jsDelayedCloseHandle = $.Schedule( kManualCloseDelay, _RunDeferredConnect );
			}
		}
	}

	var _OnAcceptMatchPressed = function ()
	{
		m_hasPressedAccept = true;
		if ( m_isManualMode )
		{
			_SendManualDecision( true );
			m_numPlayersReady = Math.max( m_numPlayersReady, 1 );
			_UpdateUiState();
			$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
			_RequestPopupClose( true );
			return;
		}
		$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );

		LobbyAPI.SetLocalPlayerReady( 'accept' );
	}

	return {
		Init					: _Init,
		ReadyForMatch			: _ReadyForMatch,
		FriendsListNameChanged	: _FriendsListNameChanged,
		OnAcceptMatchPressed	: _OnAcceptMatchPressed,
		OnCloseAcceptPopup		: _OnCloseAcceptPopup
	}

})();

(function()
{
	
	  
	                                                                                                    
	                                                                                                          
	  
	$.RegisterForUnhandledEvent( 'PanoramaComponent_FriendsList_NameChanged', PopupAcceptMatch.FriendsListNameChanged );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Lobby_ReadyUpForMatch', PopupAcceptMatch.ReadyForMatch );
	$.RegisterForUnhandledEvent( 'MatchAssistedAccept', PopupAcceptMatch.OnAcceptMatchPressed );
	$.RegisterForUnhandledEvent( 'CloseAcceptPopup', PopupAcceptMatch.OnCloseAcceptPopup );

	  
	           
	                                                                           
	                                                                          
	                                                                          
	                                                                          
	  
	
})();
