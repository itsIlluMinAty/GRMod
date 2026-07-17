'use strict';

var NewsPanel = (function () {
	var NEWS_FEED_URL = 'https://raw.githubusercontent.com/itsIlluMinAty/GRMod/main/news.json';
	var _isUsingFallbackFeed = false;

	var _RequestFallbackFeed = function()
	{
		_isUsingFallbackFeed = true;
		BlogAPI.RequestRSSFeed();
	}

	var _NormalizeFeed = function( feed )
	{
		if ( !feed || !feed.items || !Array.isArray( feed.items ) )
		{
			return null;
		}

		return feed;
	}

	var _GetNewsFeed = function()
	{
		_isUsingFallbackFeed = false;

		$.AsyncWebRequest( NEWS_FEED_URL, {
			type: 'GET',
			success: function( data )
			{
				var feed = data;

				try
				{
					if ( typeof data === 'string' )
					{
						feed = JSON.parse( data );
					}
				}
				catch ( e )
				{
					$.Msg( '[PanoramaScript] Error parsing custom news feed: ', e );
					_RequestFallbackFeed();
					return;
				}

				feed = _NormalizeFeed( feed );

				if ( !feed )
				{
					$.Msg( '[PanoramaScript] Invalid custom news feed format.' );
					_RequestFallbackFeed();
					return;
				}

				_OnFeedReceived( feed );
			},
			error: function( err )
			{
				$.Msg( '[PanoramaScript] Failed to fetch custom news feed: ', err );
				_RequestFallbackFeed();
			}
		} );
	}

	var _OnFeedReceived = function( feed )
	{
		feed = _NormalizeFeed( feed );

		if ( !feed )
		{
			return;
		}

		if( $.GetContextPanel().BHasClass( 'news-panel--hide-news-panel' ) )
		{
			return;
		};
		
		var elLister = $.GetContextPanel().FindChildInLayoutFile( 'NewsPanelLister' );

		if ( elLister === undefined || elLister === null )
			return;

		elLister.RemoveAndDeleteChildren();

		                                     
		var foundFirstNewsItem = false;

		feed[ 'items' ].forEach( function( item, i )
		{
			var elEntry = $.CreatePanel( 'Panel', elLister, 'NewEntry' + i, {
				acceptsinput: true
			} );

			var lastReadItem = GameInterfaceAPI.GetSettingString( 'ui_news_last_read_link' );
			var categories = Array.isArray( item.categories ) ? item.categories : [];
			var isFeatured = !foundFirstNewsItem && categories.indexOf( 'Minor' ) === -1;

			if ( isFeatured )
			{
				foundFirstNewsItem = true;

				if ( item.link != lastReadItem )
				{
					elEntry.AddClass( 'new' );
				}
			}

			elEntry.BLoadLayoutSnippet( 'news-full-entry' );
			var elImage = elEntry.FindChildInLayoutFile( 'NewsHeaderImage' );
			if ( elImage && item.imageUrl )
			{
				elImage.SetImage( item.imageUrl );
			}
			else if ( elImage )
			{
				elImage.SetImage( "file://{images}/store/default-news.png" );
			}

			var elEntryInfo = $.CreatePanel( 'Panel', elEntry, 'NewsInfo' + i );
			elEntryInfo.BLoadLayoutSnippet( 'news-info' );
			var description = item.description || '';

			elEntryInfo.SetDialogVariable( 'news_item_date', item.date );
			elEntryInfo.SetDialogVariable( 'news_item_title', item.title );
			elEntryInfo.SetDialogVariable( 'news_item_body', description );

			var elBlurTarget = elEntry.FindChildInLayoutFile( 'NewsEntryBlurTarget' );
			if ( elBlurTarget )
			{
				elBlurTarget.AddBlurPanel( elEntryInfo );
			}

			elEntry.SetPanelEvent( "onactivate", function( link, elEntry, clearNew )
			{
				if ( link )
				{
					SteamOverlayAPI.OpenURL( link );
				}

				if ( clearNew )
				{
					GameInterfaceAPI.SetSettingString( 'ui_news_last_read_link', link || '' );
					elEntry.RemoveClass( 'new' );
				}

			}.bind( SteamOverlayAPI, item.link, elEntry, isFeatured ) );
		
		} );
	};

	var _OnRssFeedReceived = function( feed )
	{
		if ( !_isUsingFallbackFeed )
		{
			return;
		}

		_OnFeedReceived( feed );
	};

	return {
		GetNewsFeed			: _GetNewsFeed,
		OnFeedReceived		: _OnFeedReceived,
		OnRssFeedReceived	: _OnRssFeedReceived,
	};
})();


( function()
{
	NewsPanel.GetNewsFeed();
	$.RegisterForUnhandledEvent( "PanoramaComponent_Blog_RSSFeedReceived", NewsPanel.OnRssFeedReceived );
})();