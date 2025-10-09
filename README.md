![KiwiBear](https://i.imgur.com/0S2zIH3.png)

# KiwiBear

> 🥝 A fork of [SerpBear](https://github.com/towfiqi/serpbear) with enhanced features and improvements

![GitHub](https://img.shields.io/github/license/towfiqi/serpbear) ![GitHub package.json version](https://img.shields.io/github/package-json/v/kiwimaker/kiwibear)

KiwiBear is an enhanced fork of SerpBear - an Open Source Search Engine Position Tracking and Keyword Research App. It allows you to track your website's keyword positions in Google and get notified of their position changes.

## 🚀 New Features in KiwiBear

KiwiBear extends SerpBear with powerful new capabilities for advanced SEO analysis:

### 🎯 Advanced Competitor Tracking
- **Competitor Management**: Add and track unlimited competitors per domain through the domain settings interface
- **Competitor Position Tracking**: View competitor positions alongside your own keywords in a dedicated, collapsible section
- **URL Tracking**: See which specific URLs your competitors are ranking with for each keyword
- **Competitor History**: Historical tracking of competitor positions stored in keyword history

### 🔍 Cannibalization Detection
- **Multi-URL Detection**: Automatically identifies when multiple pages from your domain rank for the same keyword
- **Visual Alerts**: Clear visual indicators in the keyword details view when cannibalization is detected
- **Detailed Analysis**: Shows all ranking URLs from your domain with their respective positions

### 📊 Enhanced SERP Tracking
- **Fixed Google num Parameter**: Corrected implementation of Google's search parameter specifically for **Serper.dev** scraper
- **Smart Auto Top 20 Management**: Intelligent automatic fetching of top 20 results based on current position:
  - If keyword ranks at position 8 or higher: Automatically performs 2 searches to capture top 20 results
  - If keyword ranks below position 8: Performs only 1 search to optimize API usage and costs
  - Can be enabled per domain or per individual keyword
- **Configurable SERP Pages**: Flexible configuration to fetch multiple pages of results per keyword
- **SERP Snippet Capture**: Stores the organic snippets/meta descriptions returned by Serper.dev and surfaces them in keyword and idea detail views

### 🗂️ URL History Tracking
- **Historical URL Records**: Every position change now includes the ranking URL, not just the position
- **Chart Tooltips**: Hover over any point in the position history chart to see which URL was ranking at that time
- **URL Change Detection**: Track when different URLs from your domain start ranking for the same keyword

### 🎯 Custom Keyword Ordering
- **Drag & Drop Ordering**: Intuitive drag-and-drop interface to manually reorder keywords
- **Persistent Custom Order**: Save and maintain your custom keyword order across sessions
- **Device-Specific Ordering**: Separate custom ordering for desktop and mobile keywords
- **Visual Feedback**: Clear highlighting of active device and current position during reordering

### 🎨 UI/UX Improvements
- **Desktop-Optimized Layout**: Wider main container for better data visualization on desktop screens
- **Collapsible Sidebar**: Enhanced navigation with space-saving collapsible sidebar
- **Enhanced Stats Page**: Comprehensive statistics with improved visualizations
- **Better Data Display**: Improved tables and data presentation throughout the application
- **Advanced Sorting Options**: Multiple sort criteria including:
  - Position (top/lowest)
  - Date added (recent/oldest)
  - Alphabetical (A-Z/Z-A)
  - Search volume (highest/lowest)
  - **URL (A-Z/Z-A)** - Sort by ranking URL
  - Impressions (most/least viewed) - when Search Console is integrated
  - Visits (most/least visited) - when Search Console is integrated

> **Note:** KiwiBear has been optimized primarily for desktop use with a wider main container to better display the enhanced data tables and additional columns.

## 🐳 Docker Deployment

KiwiBear is available as a Docker image on Docker Hub:

```bash
docker pull kiwimaker/kiwibear:latest
```

**Platform Support:** Currently, only `linux/amd64` architecture is available on Docker Hub.

## ⚠️ Development Notice

This project was developed through **live coding sessions** as an experimental enhancement of SerpBear. While we've implemented many powerful features, some aspects may not be perfectly polished.

**We recommend:**
- Using KiwiBear in **testing environments** first
- Ideal for **personal use** and small-scale projects
- Testing features thoroughly before production deployment
- Reporting any issues you encounter

The project is functional and actively maintained, but may contain edge cases or minor bugs that are being addressed over time.

## Credits

KiwiBear is based on the excellent work of [SerpBear](https://github.com/towfiqi/serpbear) by [towfiqi](https://github.com/towfiqi). We extend our gratitude to the original author and all contributors.

## License

This project maintains the same license as the original SerpBear project.
