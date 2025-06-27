const validator = require('validator');
const { Logger } = require('../../Logging Middleware/logger');
const UrlService = require('../services/urlService');

class UrlController {
  
  // Create a new short URL
  static async createShortUrl(req, res) {
    try {
      const { url, validity, shortcode } = req.body;

      // Basic validation
      if (!url) {
        Logger.warn('validation', 'Missing URL in request');
        return res.status(400).json({
          error: 'Validation Error',
          message: 'URL is required'
        });
      }

      // Check if URL is valid - more permissive validation for long URLs
      try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch (e) {
        Logger.warn('validation', `Invalid URL provided: ${url.substring(0, 100)}...`);
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid URL format. Must include protocol (http/https)'
        });
      }

      // Set validity period (default 30 minutes)
      let validityInMinutes = 30;
      if (validity !== undefined) {
        if (!Number.isInteger(validity) || validity <= 0) {
          Logger.warn('validation', `Invalid validity period: ${validity}`);
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Validity must be a positive integer (minutes)'
          });
        }
        validityInMinutes = validity;
      }

      // Handle custom shortcode
      if (shortcode) {
        // Simple validation for shortcode
        if (!/^[a-zA-Z0-9]+$/.test(shortcode) || shortcode.length < 3 || shortcode.length > 20) {
          Logger.warn('validation', `Invalid shortcode format: ${shortcode}`);
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Shortcode must be alphanumeric, 3-20 characters'
          });
        }

        // Check if shortcode already exists
        if (UrlService.shortcodeExists(shortcode)) {
          Logger.warn('validation', `Duplicate shortcode attempt: ${shortcode}`);
          return res.status(409).json({
            error: 'Conflict',
            message: 'Shortcode already exists. Please choose another one.'
          });
        }
      }

      // Generate shortcode if not provided
      const finalShortcode = shortcode || UrlService.generateShortcode();
      
      // Create the URL entry
      const urlEntry = UrlService.createUrl(url, validityInMinutes, finalShortcode);
      
      // Build the short link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const shortLink = `${baseUrl}/${finalShortcode}`;

      Logger.info('url-creation', `Created short URL: ${finalShortcode} for ${url}`);

      res.status(201).json({
        shortLink: shortLink,
        expiry: urlEntry.expiryDate
      });

    } catch (error) {
      Logger.error('url-creation', `Failed to create short URL: ${error.message}`);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create short URL'
      });
    }
  }

  // Redirect to the original URL
  static async redirectToOriginal(req, res) {
    try {
      const shortcode = req.params.shortcode;
      
      Logger.info('redirect', `Attempting redirect for: ${shortcode}`);

      // Get the URL data
      const urlEntry = UrlService.getUrl(shortcode);
      
      if (!urlEntry) {
        Logger.warn('redirect', `Shortcode not found: ${shortcode}`);
        return res.status(404).json({
          error: 'Not Found',
          message: 'Shortcode does not exist'
        });
      }

      // Check if the URL has expired
      if (UrlService.isExpired(urlEntry)) {
        Logger.warn('redirect', `Expired shortcode accessed: ${shortcode}`);
        return res.status(410).json({
          error: 'Gone',
          message: 'This short link has expired'
        });
      }

      // Track the click
      const clickInfo = {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent') || 'Unknown',
        referer: req.get('Referer') || 'direct'
      };
      
      UrlService.trackClick(shortcode, clickInfo);

      Logger.info('redirect', `Redirecting ${shortcode} to ${urlEntry.originalUrl}`);

      // Perform the redirect
      res.redirect(301, urlEntry.originalUrl);

    } catch (error) {
      Logger.error('redirect', `Redirect failed: ${error.message}`);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to redirect'
      });
    }
  }

  // Get statistics for a short URL
  static async getUrlStatistics(req, res) {
    try {
      const shortcode = req.params.shortcode;
      
      Logger.info('statistics', `Getting stats for: ${shortcode}`);

      // Get the URL data
      const urlEntry = UrlService.getUrl(shortcode);
      
      if (!urlEntry) {
        Logger.warn('statistics', `Stats requested for non-existent shortcode: ${shortcode}`);
        return res.status(404).json({
          error: 'Not Found',
          message: 'Shortcode does not exist'
        });
      }

      // Get the statistics
      const stats = UrlService.getStatistics(shortcode);
      
      Logger.info('statistics', `Stats retrieved for ${shortcode}: ${stats.totalClicks} clicks`);

      res.json(stats);

    } catch (error) {
      Logger.error('statistics', `Failed to get stats: ${error.message}`);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve statistics'
      });
    }
  }
}

module.exports = UrlController;
