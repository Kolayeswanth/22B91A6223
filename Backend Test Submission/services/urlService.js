const { nanoid } = require('nanoid');
const { Logger } = require('../../Logging Middleware/logger');

class UrlService {
  constructor() {
    // Simple in-memory storage for demo purposes
    this.urlDatabase = new Map();
    this.clickDatabase = new Map();
  }

  // Generate a unique shortcode
  generateShortcode() {
    let code;
    do {
      code = nanoid(8); // Generate 8-character random ID
    } while (this.urlDatabase.has(code));
    return code;
  }

  // Check if a shortcode already exists
  shortcodeExists(shortcode) {
    return this.urlDatabase.has(shortcode);
  }

  // Create a new URL entry
  createUrl(originalUrl, validityMinutes, shortcode) {
    const currentTime = new Date();
    const expiryTime = new Date(currentTime.getTime() + validityMinutes * 60 * 1000);
    
    const urlData = {
      originalUrl: originalUrl,
      shortcode: shortcode,
      creationDate: currentTime.toISOString(),
      expiryDate: expiryTime.toISOString(),
      validityMinutes: validityMinutes
    };

    // Store the URL data
    this.urlDatabase.set(shortcode, urlData);
    this.clickDatabase.set(shortcode, []);

    Logger.info('url-service', `New URL stored: ${shortcode} -> ${originalUrl}`);
    
    return urlData;
  }

  // Get URL data by shortcode
  getUrl(shortcode) {
    return this.urlDatabase.get(shortcode);
  }

  // Check if a URL has expired
  isExpired(urlData) {
    const now = new Date();
    const expiry = new Date(urlData.expiryDate);
    return now > expiry;
  }

  // Track a click on the short URL
  trackClick(shortcode, clickData) {
    if (!this.clickDatabase.has(shortcode)) {
      this.clickDatabase.set(shortcode, []);
    }

    // Create a simple click record
    const clickRecord = {
      timestamp: clickData.timestamp,
      source: this.determineSource(clickData.referer),
      location: "India" // Simple default for demo
    };

    this.clickDatabase.get(shortcode).push(clickRecord);
    Logger.info('click-tracking', `Click recorded for ${shortcode}`);
  }

  // Simple method to determine traffic source
  determineSource(referer) {
    if (!referer || referer === 'direct') {
      return 'direct';
    }
    return 'referral';
  }

  // Get statistics for a shortcode
  getStatistics(shortcode) {
    const urlData = this.urlDatabase.get(shortcode);
    const clicks = this.clickDatabase.get(shortcode) || [];

    if (!urlData) {
      return null;
    }

    // Build simple statistics
    const totalClicks = clicks.length;
    
    // Get recent click details (last 10 clicks)
    const recentClicks = clicks.slice(-10).map(click => ({
      timestamp: click.timestamp,
      source: click.source,
      location: click.location
    }));

    return {
      totalClicks: totalClicks,
      creationDate: urlData.creationDate,
      expiryDate: urlData.expiryDate,
      clickDetails: recentClicks
    };
  }

  // Get all URLs (for debugging)
  getAllUrls() {
    return Array.from(this.urlDatabase.values());
  }
}

// Create and export a single instance
const urlService = new UrlService();
module.exports = urlService;
