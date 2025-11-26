// URL encoding for experiment sharing

import { serializeExperiment, deserializeExperiment } from './persistence';
import type { Experiment } from '../core/types';

// Simple base64 encoding for URL sharing
// For production, you might want to use LZ-string or similar compression library

function stringToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str));
  } catch (error) {
    console.error('Failed to encode to base64:', error);
    return '';
  }
}

function base64ToString(base64: string): string {
  try {
    return decodeURIComponent(atob(base64));
  } catch (error) {
    console.error('Failed to decode from base64:', error);
    return '';
  }
}

export function encodeExperimentToURL(experiment: Experiment): string {
  const serialized = serializeExperiment(experiment);
  const json = JSON.stringify(serialized);
  const base64 = stringToBase64(json);
  
  // Create shareable URL with experiment in hash
  const url = new URL(window.location.href);
  url.hash = `exp=${base64}`;
  
  return url.toString();
}

export function decodeExperimentFromURL(url: string = window.location.href): Experiment | null {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash.substring(1); // Remove #
    
    if (!hash.startsWith('exp=')) return null;
    
    const base64 = hash.substring(4); // Remove 'exp='
    const json = base64ToString(base64);
    
    if (!json) return null;
    
    const serialized = JSON.parse(json);
    return deserializeExperiment(serialized);
  } catch (error) {
    console.error('Failed to decode experiment from URL:', error);
    return null;
  }
}

export function hasExperimentInURL(url: string = window.location.href): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hash.startsWith('#exp=');
  } catch {
    return false;
  }
}

export async function copyURLToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

