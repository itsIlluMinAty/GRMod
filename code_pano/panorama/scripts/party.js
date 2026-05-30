'use strict';

                                               
	            
		     
		  
		          
		    
		           
			    
				      
				        
				     
				   
				      
				     
				       
				         
				    
				     
			    
			    
	           
	          
	        
  


                                                     
                                                       
                                                     
var PartyMenu = ( function()
{
	var k_fakeMmActiveKey = 'ui_fake_matchmaking_active';
	var k_fakeMmStatusKey = 'ui_fake_matchmaking_status';
	var m_eventRebuildPartyList;

	var m_prevMembersInParty = -1;
	var m_acceptPopupVisible = false;
	var m_manualPopupLatched = false;
	var m_manualPopupSuppressed = false;
	var m_acceptPopupPollHandle = false;

	var _GetPartySessionSetting = function( key )
	{
		if ( typeof PartyListAPI === 'undefined' || !PartyListAPI.GetPartySessionSetting )
		{
			return '';
		}

		var value = PartyListAPI.GetPartySessionSetting( key );
		return value === undefined || value === null ? '' : value;
	};

	var _InferModeFromMapGroup = function( mapGroup )
	{
		if ( !mapGroup )
		{
			return '';
		}

		var primaryGroup = mapGroup.split( ',' )[ 0 ] || '';
		if ( primaryGroup.indexOf( 'mg_dz_' ) === 0 )
		{
			return 'survival';
		}

		if ( primaryGroup.indexOf( 'mg_wingman_' ) === 0 )
		{
			return 'scrimcomp2v2';
		}

		if ( primaryGroup.indexOf( 'mg_skirmish_' ) === 0 || primaryGroup === 'mg_armsrace' || primaryGroup === 'mg_demolition' )
		{
			return 'skirmish';
		}

		if ( primaryGroup.indexOf( 'mg_comp_' ) === 0 || primaryGroup === 'mg_lobby_mapveto' )
		{
			return 'competitive';
		}

		return '';
	};

	var _ResolveQueueUiSettings = function( settings )
	{
		var game = settings && settings.game ? settings.game : {};
		var resolved = {
			mode: game.mode || _GetPartySessionSetting( 'game/mode' ) || '',
			mapGroup: game.mapgroupname || _GetPartySessionSetting( 'game/mapgroupname' ) || '',
			map: game.map || _GetPartySessionSetting( 'game/map' ) || ''
		};

		if ( !resolved.mode )
		{
			resolved.mode = _InferModeFromMapGroup( resolved.mapGroup );
		}

		return resolved;
	};

	var _Init = function()
	{
		_RefreshPartyMembers();
		_AddOnActivateLeaveBtn();
		_ShowMatchmakingStatusTooltipEvent();
		_StartAcceptPopupPolling();
	};

	var _StartAcceptPopupPolling = function()
	{
		if ( m_acceptPopupPollHandle )
		{
			$.CancelScheduled( m_acceptPopupPollHandle );
		}

		var _Poll = function()
		{
			m_acceptPopupPollHandle = false;
			_UpdateAcceptPopupState();
			m_acceptPopupPollHandle = $.Schedule( 0.25, _Poll );
		};

		m_acceptPopupPollHandle = $.Schedule( 0.25, _Poll );
	};

	var _RefreshPartyMembers = function()
	{
		if ( !_IsSessionActive() )
		{
			return;
		}

		var lobbySettings = LobbyAPI.GetSessionSettings().game;
		if ( !lobbySettings )
		{
			return;
		}


		var elPartyMembersList = $( '#PartyList' ).FindChildInLayoutFile( 'PartyMembers' );
		var numPlayersActuallyInParty = PartyListAPI.GetCount();

		if ( numPlayersActuallyInParty > m_prevMembersInParty )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'PanoramaUI.Lobby.Joined', 'PartyList' );
		}
		else if ( numPlayersActuallyInParty < m_prevMembersInParty )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'PanoramaUI.Lobby.Left', 'PartyList' );
		}

		m_prevMembersInParty = numPlayersActuallyInParty;


		                                                                                    
		var bIsSearching = _IsSearching();
		if ( numPlayersActuallyInParty >= PartyListAPI.GetPartySessionUiThreshold() || bIsSearching )
		{
			elPartyMembersList.RemoveAndDeleteChildren();
			_UpdateMembersList( lobbySettings, numPlayersActuallyInParty );
		}
		else
		{
			$( '#PartyList' ).AddClass( 'hidden' );
			elPartyMembersList.RemoveAndDeleteChildren();
			friendsList.HideLocalPlayer( false );
		}

		                                                               
		                                                                                                                               
		$( '#PartyList' ).GetParent().SetHasClass( 'friendslist-party-searching', bIsSearching && ( numPlayersActuallyInParty <= 1 ) );

		_UpdateLeaveBtn( numPlayersActuallyInParty );
	};

	var _IsSessionActive = function()
	{
		if ( !LobbyAPI.IsSessionActive() )
		{
			$( '#PartyList' ).AddClass( 'hidden' );
			$( '#PartyList' ).GetParent().SetHasClass( 'friendslist-party-searching', false );
			friendsList.HideLocalPlayer( false );
			return false;
		}

		return true;
	};

	var _UpdateMembersList = function( lobbySettings, numPlayersActuallyInParty )
	{
		                                                                  
		                                                                                          
		var maxAllowedInLobby = 10;
		var numPlayersPossibleInMode = SessionUtil.GetMaxLobbySlotsForGameMode( lobbySettings.mode );

		$( '#PartyList' ).RemoveClass( 'hidden' );

		friendsList.HideLocalPlayer( true );

		for ( var i = 0; i < maxAllowedInLobby; i++ )
		{
			var xuid = i < numPlayersActuallyInParty ? PartyListAPI.GetXuidByIndex( i ) : 0;
		
			var isOverPossible = ( numPlayersActuallyInParty > numPlayersPossibleInMode ) ? true : false;
			var elPartyMemberCurrent = null;

			if ( i < numPlayersActuallyInParty )
			{
				elPartyMemberCurrent = _MakeNewPartyMemberTile( "PartyMember" + i, xuid );
				_SetPartyMemberName( elPartyMemberCurrent, xuid );
				_SetPartyMemberRank( elPartyMemberCurrent, xuid );
				_SetPrimeForMember( elPartyMemberCurrent, xuid );
				_UpdateAvatar( elPartyMemberCurrent, xuid )
				_TintForOverPlayerCountForMode( elPartyMemberCurrent, isOverPossible );
			}
		}

		_SetLobbyTitle( numPlayersPossibleInMode, numPlayersActuallyInParty );
	};

	var _MakeNewPartyMemberTile = function( panelIdToLoad, xuid )
	{
		var elParent = $.GetContextPanel().FindChildInLayoutFile( 'PartyMembers' );
		var elPartyMember = $.CreatePanel( "Panel", elParent, panelIdToLoad );
		elPartyMember.BLoadLayoutSnippet( 'PartyMember' );
		elPartyMember.Data().xuid = xuid; 
		var memberBtn = elPartyMember.FindChildInLayoutFile( 'PartyMemberBtn');

		var elAvatar =  $.CreatePanel( "Panel", memberBtn, xuid );
		_SetAttributeStringsOnAvatarPanel( elAvatar, xuid );
		elAvatar.BLoadLayout( 'file://{resources}/layout/avatar.xml', false, false );
		elAvatar.BLoadLayoutSnippet( "AvatarParty" );
		elAvatar.enabled = false;

		memberBtn.MoveChildBefore( elAvatar,memberBtn.GetChild( 0 ) );

		if ( xuid !== 0 && xuid )
			_AddOpenPlayerCardAction( memberBtn, xuid );
		else
			_ClearExisitingOnActivateEvent( memberBtn );

		return elPartyMember;
	};

	var _UpdateAvatar = function( elPartyMember, xuid )
	{
		var elAvatar = elPartyMember.FindChildInLayoutFile( xuid );
		Avatar.Init( elAvatar, xuid, 'playercard' );
	};

	var _SetPartyMemberName = function( elPartyMember, xuid )
	{
		var elName = elPartyMember.FindChildInLayoutFile( 'JsFriendName' );
		elName.text = FriendsListAPI.GetFriendName( xuid );
	};

	var _SetPartyMemberRank = function( elPartyMember, xuid )
	{
		var skillgroupType = PartyListAPI.GetFriendCompetitiveRankType( xuid );
		var skillGroup = PartyListAPI.GetFriendCompetitiveRank( xuid, skillgroupType );
		var wins = PartyListAPI.GetFriendCompetitiveWins( xuid, skillgroupType );
		var winsNeededForRank = SessionUtil.GetNumWinsNeededForRank( skillgroupType );
		var elRank = elPartyMember.FindChildInLayoutFile( 'PartyRank' ); 

		                                                                                                                                                    
		
		if ( wins < winsNeededForRank || ( wins >= winsNeededForRank && skillGroup < 1 ) || !PartyListAPI.GetFriendPrimeEligible( xuid ) )
		{
			elRank.visible = false;
			return;
		}

		var imageName = ( skillgroupType !== 'Competitive' ) ? skillgroupType : 'skillgroup';
		elRank.SetImage( 'file://{images}/icons/skillgroups/' + imageName + skillGroup + '.svg' );
		elRank.visible = true;
	};

	var _SetPrimeForMember = function( elPartyMember, xuid )
	{
		var elPrime = elPartyMember.FindChildInLayoutFile( 'PartyPrime' ); 
		elPrime.visible = PartyListAPI.GetFriendPrimeEligible( xuid );
	};

	var _TintForOverPlayerCountForMode = function ( elPartyMember, isOverCount )
	{
		elPartyMember.SetHasClass( 'friendtile--warning', isOverCount );
	}

	var _SetLobbyTitle = function (  numPlayersPossibleInMode, numPlayersActuallyInParty )
	{
		var elPanel = $( '#PartyList' ).FindChildInLayoutFile( 'PartyListHeader' );
		var isSoloSearch = ( numPlayersActuallyInParty === 1 );

		elPanel.FindChildInLayoutFile( 'PartyCancelBtn' ).visible = LobbyAPI.BIsHost() && _IsSearching();

		var elCount = elPanel.FindChildInLayoutFile( 'PartyTitleAlertText' );
		elCount.text = numPlayersActuallyInParty +'/' +numPlayersPossibleInMode;

		                                                                         
		                                                          
	}

	var _SetAttributeStringsOnAvatarPanel = function( elAvatar, xuid )
	{
		elAvatar.SetAttributeString( 'xuid', xuid );
		elAvatar.SetAttributeString( 'showleader', _ShowLobbyLeaderIcon( xuid ) );
	};

	var _ShowLobbyLeaderIcon = function( xuid )
	{
		return LobbyAPI.GetHostSteamID() === xuid ? 'show' : '';
	};

	var _AddOpenPlayerCardAction = function( elPartyMember, xuid )
	{
		var openCard = function( xuid )
		{
			                                                                                             
			$.DispatchEvent( 'SidebarContextMenuActive', true );

			if ( xuid !== 0 )
			{
				var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
					'',
					'',
					'file://{resources}/layout/context_menus/context_menu_playercard.xml',
					'xuid=' + xuid,
					function()
					{
						$.DispatchEvent( 'SidebarContextMenuActive', false );
					}
				);
				contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
			}
		};

		elPartyMember.SetPanelEvent( "onactivate", openCard.bind( undefined, xuid ) );
		elPartyMember.SetPanelEvent( "oncontextmenu", openCard.bind( undefined, xuid ) );
	};

	var _ClearExisitingOnActivateEvent = function( elPartyMember )
	{
		elPartyMember.SetPanelEvent( "onactivate", function()
		{

		} );

		var OnMouseOver = function( elPartyMember )
		{
			UiToolkitAPI.ShowTextTooltip( elPartyMember.id, '#tooltip_invite_to_lobby' );
		};

		elPartyMember.SetPanelEvent( "onmouseover", OnMouseOver.bind( undefined, elPartyMember ) );

		elPartyMember.SetPanelEvent( "onmouseout", function()
		{
			UiToolkitAPI.HideTextTooltip();
		} );
	};

	var _SessionUpdate = function( updateType )
	{
		                                                                                                      
		if ( LobbyAPI.IsSessionActive() )
		{
			if ( m_eventRebuildPartyList == undefined )
			{
				m_eventRebuildPartyList = $.RegisterForUnhandledEvent( "PanoramaComponent_PartyList_RebuildPartyList", PartyMenu.RefreshPartyMembers );
			}
		}
		else
		{
			if ( m_eventRebuildPartyList )
			{
				$.UnregisterForUnhandledEvent( "PanoramaComponent_PartyList_RebuildPartyList", m_eventRebuildPartyList );
				m_eventRebuildPartyList = undefined;
			}
		}

		_RefreshPartyMembers();
		_TintBgForSearch();
		_UpdateAcceptPopupState();
	};

	var _UpdateAcceptPopupState = function()
	{
		var manualConnectStarted = GameInterfaceAPI.GetSettingString( 'ui_manual_connect_started' ) === '1';
		if ( manualConnectStarted || GameStateAPI.IsLocalPlayerPlayingMatch() )
		{
			GameInterfaceAPI.SetSettingString( k_fakeMmActiveKey, '0' );
			GameInterfaceAPI.SetSettingString( k_fakeMmStatusKey, '' );
			m_manualPopupLatched = false;
			m_manualPopupSuppressed = false;

			if ( m_acceptPopupVisible )
			{
				m_acceptPopupVisible = false;
				$.DispatchEvent( 'CloseAcceptPopup' );
			}
			return;
		}
		var rawStatus = _GetSearchStatus() || '';
		var localizedStatus = rawStatus && rawStatus.charAt( 0 ) === '#' ? $.Localize( rawStatus ) : rawStatus;
		var loweredRawStatus = rawStatus.toLowerCase();
		var loweredLocalizedStatus = localizedStatus.toLowerCase();
		var isConfirming = !manualConnectStarted && ( loweredRawStatus.indexOf( 'confirm' ) !== -1 || loweredLocalizedStatus.indexOf( 'confirm' ) !== -1 || LobbyAPI.GetReadyTimeRemainingSeconds() > 0 );
		var shouldShowPopup = !manualConnectStarted && ( _IsManualMatchReserved() || isConfirming );

		if ( shouldShowPopup )
		{
			if ( !m_manualPopupLatched && !m_manualPopupSuppressed )
			{
				m_manualPopupLatched = true;
				_ShowMatchAcceptPopUp( _GetManualReservationMap(), true );
			}
			return;
		}

		m_manualPopupLatched = false;
		m_manualPopupSuppressed = false;

		if ( m_acceptPopupVisible )
		{
			m_acceptPopupVisible = false;
			$.DispatchEvent( 'CloseAcceptPopup' );
		}
	};

	var _IsManualMatchReserved = function()
	{
		var clanId = GameInterfaceAPI.GetSettingString( 'cl_clanid' );
		return clanId === '999999999' || clanId === '999999998';
	};

	var _GetManualReservationMap = function()
	{
		var settings = LobbyAPI.GetSessionSettings();
		var resolved = _ResolveQueueUiSettings( settings );
		if ( resolved.map )
		{
			return resolved.map;
		}

		if ( resolved.mapGroup )
		{
			var mapGroups = resolved.mapGroup.split( ',' );
			if ( mapGroups.length === 1 && mapGroups[ 0 ].indexOf( 'mg_' ) === 0 )
			{
				return mapGroups[ 0 ].substring( 3 );
			}
		}

		return 'de_dust2';
	};

	var _TintBgForSearch = function()
	{	
		var serverWarning = NewsAPI.GetCurrentActiveAlertForUser();
		var isWarning = serverWarning !== '' && serverWarning !== undefined ? true : false;

		$.GetContextPanel().FindChildInLayoutFile( 'MatchStatusBackground' ).SetHasClass( 'party-list__bg--warning', ( isWarning && _IsSeaching() ) );
		$.GetContextPanel().FindChildInLayoutFile( 'MatchStatusBackground' ).SetHasClass( 'party-list__bg--searching', _IsSeaching() );
	};

	var _IsSeaching = function()
	{
		var StatusString = _GetSearchStatus();
		return ( StatusString !== '' && StatusString !== null ) ? true : false;
	};

	var _PlayerActivityVoice = function( xuid )
	{
		var elPartyMembersList = $( '#PartyList' ).FindChildInLayoutFile( 'PartyMembers' );

		elPartyMembersList.Children().forEach(element => {
			if ( element.Data().xuid === xuid )
			{
				var elAvatar = element.FindChildInLayoutFile( xuid );
				if ( elAvatar )
				{
					Avatar.UpdateTalkingState( elAvatar, xuid );
				}
			}
		});
	};

	                                                                                                    
	var _UpdateLeaveBtn = function ( numPlayersActuallyInParty )
	{
		var elLeaveBtn = $( '#PartyList' ).FindChildInLayoutFile( 'PartyLeaveBtn' );
		elLeaveBtn.visible = ( !GameStateAPI.IsLocalPlayerPlayingMatch() && LobbyAPI.IsSessionActive() );
	};

	var _AddOnActivateLeaveBtn= function ()
	{
		var elLeaveBtn = $( '#PartyList' ).FindChildInLayoutFile( 'PartyLeaveBtn' );
		elLeaveBtn.SetPanelEvent( 'onactivate', function(){ LobbyAPI.CloseSession(); } );
	};
	
	                                                                                                    
	                          
	                                                                                                    
	var _GetSearchStatus = function()
	{
		if ( GameStateAPI.IsLocalPlayerPlayingMatch() || GameInterfaceAPI.GetSettingString( 'ui_manual_connect_started' ) === '1' )
		{
			return '';
		}

		if ( GameInterfaceAPI.GetSettingString( k_fakeMmActiveKey ) === '1' )
		{
			var clanId = GameInterfaceAPI.GetSettingString( 'cl_clanid' );
			if ( clanId === '999999999' || clanId === '999999998' )
			{
				return 'Confirming match';
			}

			var fakeStatus = GameInterfaceAPI.GetSettingString( k_fakeMmStatusKey );
			return fakeStatus !== '' ? fakeStatus : 'Searching';
		}

		return LobbyAPI.GetMatchmakingStatusString();
	};

	var _IsSearching = function()
	{
		var StatusString = _GetSearchStatus();
		return ( StatusString !== '' && StatusString !== null ) ? true : false;
	};

	                                                                                                    

	var _ShowMatchmakingStatusTooltipEvent = function()
	{
		var btnSettings = $.GetContextPanel().FindChildInLayoutFile( 'MatchStatusInfo' );
		btnSettings.SetPanelEvent( 'onmouseover', function()
		{
			UiToolkitAPI.ShowCustomLayoutParametersTooltip( 'MatchStatusInfo',
				'LobbySettingsTooltip',
				'file://{resources}/layout/tooltips/tooltip_lobby_settings.xml',
				'xuid=' + ''
			);
		} );

		btnSettings.SetPanelEvent( 'onmouseout', function() { UiToolkitAPI.HideCustomLayoutTooltip('LobbySettingsTooltip'); } );
	};

	var _ShowMatchAcceptPopUp = function( map, isManual )
	{
		if ( m_acceptPopupVisible )
		{
			return;
		}

		if ( !isManual && _IsManualMatchReserved() )
		{
			isManual = true;
			map = _GetManualReservationMap();
		}

		var popupParams = 'map_and_isreconnect=' + map + ',false';
		if ( isManual )
		{
			var settings = LobbyAPI.GetSessionSettings();
			var resolved = _ResolveQueueUiSettings( settings );
			var popupMap = map;
			var imageMap = map;
			var mode = resolved.mode || '';
			var mapGroup = resolved.mapGroup || '';
			var mapGroupLabel = '';

			if ( resolved.map )
			{
				popupMap = resolved.map;
				imageMap = resolved.map;
			}
			else if ( mapGroup )
			{
				var mapGroups = mapGroup.split( ',' );
				if ( mapGroups.length >= 1 && mapGroups[ 0 ].indexOf( 'mg_' ) === 0 )
				{
					var primaryGroup = mapGroups[ 0 ];
					var mg = GetMGDetails( primaryGroup );
					if ( mg )
				{
						mapGroupLabel = $.Localize( mg.nameID );
						var mapKeys = Object.keys( mg.maps || {} );
						if ( mapKeys.length > 0 )
					{
							popupMap = mapKeys[ 0 ];
							imageMap = mapKeys[ 0 ];
					}
				}

					if ( !mapGroupLabel )
					{
						popupMap = primaryGroup.substring( 3 );
						imageMap = popupMap;
					}
				}
			}

			popupParams = 'map_and_isreconnect=' + popupMap + ',false&manual=true&manual_map=' + popupMap + '&manual_mode=' + mode + '&manual_image_map=' + imageMap + '&manual_group=' + mapGroup + '&manual_group_label=' + $.UrlEncode( mapGroupLabel ) + '&manual_announcement=false';
		}

		var popup = UiToolkitAPI.ShowGlobalCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_accept_match.xml', popupParams );
		m_acceptPopupVisible = true;
		$.DispatchEvent( "ShowAcceptPopup", popup );
	};

	var _OnAcceptPopupClosed = function()
	{
		m_acceptPopupVisible = false;
		m_manualPopupSuppressed = true;
	};

	return {
		Init	: _Init,
		SessionUpdate	: _SessionUpdate,
		RefreshPartyMembers	:_RefreshPartyMembers,
		PlayerActivityVoice: _PlayerActivityVoice,
		ShowMatchAcceptPopUp: _ShowMatchAcceptPopUp,
		OnAcceptPopupClosed: _OnAcceptPopupClosed
	};
} )();




                                                                                                    
                                           
                                                                                                    
(function()
{
	PartyMenu.Init();
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", PartyMenu.SessionUpdate );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_PlayerUpdated", PartyMenu.SessionUpdate );
	$.RegisterForUnhandledEvent( "PanoramaComponent_PartyList_PlayerActivityVoice", PartyMenu.PlayerActivityVoice );
	$.RegisterForUnhandledEvent( 'CloseAcceptPopup', PartyMenu.OnAcceptPopupClosed );

})();
