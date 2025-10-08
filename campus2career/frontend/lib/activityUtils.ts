export function formatActivityMessage(activity: {
  action: string;
  entity: 'company' | 'job-role' | 'document';
  entityName: string;
  details?: string;
}): string {
  const { action, entity, entityName, details } = activity;
  
  const entityEmojis = {
    'company': '🏢',
    'job-role': '💼',
    'document': '📄'
  };

  const actionMessages = {
    'created': 'Added new',
    'updated': 'Updated',
    'deleted': 'Deleted',
    'uploaded': 'Uploaded',
    'viewed': 'Viewed',
    'downloaded': 'Downloaded'
  };

  const baseMessage = `${actionMessages[action as keyof typeof actionMessages] || action} ${entity.replace('-', ' ')}`;
  const emoji = entityEmojis[entity];
  
  if (details) {
    return `${emoji} ${baseMessage}: ${entityName} • ${details}`;
  }
  
  return `${emoji} ${baseMessage}: ${entityName}`;
}

export function formatActivityTime(timestamp: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }
}
