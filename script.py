import requests
import argparse
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Для запуску - команда python -u script.py ukma-cs-ssdm-2025 team-bottleneck --token ghp-token

FILE_PATH = "docs/ci-cd/metrics-raw.md"

def get_workflow_runs(owner, repo, token=None, workflow_name=None, per_page=100):
    headers = {}
    if token:
        headers['Authorization'] = f'token {token}'
        headers['Accept'] = 'application/vnd.github.v3+json'
    
    url = f'https://api.github.com/repos/{owner}/{repo}/actions/runs'
    params = {'per_page': per_page}
    
    if workflow_name:
        # Get workflow ID first
        workflows_url = f'https://api.github.com/repos/{owner}/{repo}/actions/workflows'
        resp = requests.get(workflows_url, headers=headers)
        resp.raise_for_status()
        workflows = resp.json()['workflows']
        
        workflow_id = None
        for wf in workflows:
            if workflow_name.lower() in wf['name'].lower() or workflow_name in wf['path']:
                workflow_id = wf['id']
                break
        
        if workflow_id:
            url = f'https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs'
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()['workflow_runs']


def get_all_runs_optimized(owner, repo, token=None, limit=100):
    headers = {}
    if token:
        headers['Authorization'] = f'token {token}'
        headers['Accept'] = 'application/vnd.github.v3+json'
    
    print("🚀 Fetching all workflow runs in one batch...")
    url = f'https://api.github.com/repos/{owner}/{repo}/actions/runs'
    params = {'per_page': min(limit * 2, 100)} 
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    all_runs = response.json()['workflow_runs']
    
    runs_by_commit = defaultdict(list)
    for run in all_runs:
        runs_by_commit[run['head_sha']].append(run)
    
    return all_runs, runs_by_commit


def check_deployment_optimized(sha, runs_by_commit):
    if sha not in runs_by_commit:
        return 'n/a'
    
    for run in runs_by_commit[sha]:
        if 'DeployToEC2' in run['path'] or 'deploy' in run['name'].lower():
            return '✅' if run['conclusion'] == 'success' else '❌'
    
    return 'n/a'


def format_status(conclusion):
    """Convert conclusion to emoji status"""
    status_map = {
        'success': '✅',
        'failure': '❌',
        'cancelled': '🚫',
        'skipped': '⏭️',
        'timed_out': '⏱️'
    }
    return status_map.get(conclusion, '❓')


def calculate_duration(started_at, completed_at):
    if not started_at or not completed_at:
        return 'n/a'
    
    start = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
    end = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
    duration = (end - start).total_seconds()
    return int(duration)


def extract_notes(run):
    if run['conclusion'] == 'success':
        return '--'
    elif run['conclusion'] == 'failure':
        return f"failed in {run['name']}"
    elif run['conclusion'] == 'cancelled':
        return 'cancelled by user'
    elif run['conclusion'] == 'timed_out':
        return 'timeout'
    return '--'


def generate_markdown_table(runs, runs_by_commit):
    lines = [
        "| Run # | Commit SHA | Status | Start → End (s) | Deployed? | Notes           |",
        "|-------|------------|--------|-------------------|-----------|-----------------|"
    ]
    
    print("📊 Generating table...")
    for idx, run in enumerate(runs, 1):
        sha = run['head_sha'][:7]
        status = format_status(run['conclusion'])
        duration = calculate_duration(run['created_at'], run['updated_at'])
        deployed = check_deployment_optimized(run['head_sha'], runs_by_commit)
        notes = extract_notes(run)
        
        line = f"| {idx:<5} | {sha:<10} | {status:<6} | {duration:<17} | {deployed:<9} | {notes:<15} |"
        lines.append(line)
        
        if idx % 10 == 0:
            print(f"  ✓ Processed {idx} runs...")
    
    return '\n'.join(lines)


def update_metrics_file(table_content, file_path=FILE_PATH):
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    content = f"""# CI/CD Metrics

Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Workflow Runs

{table_content}

---
*Generated automatically from GitHub Actions API*
"""
    
    path.write_text(content, encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(
        description='Extract GitHub workflow runs and update metrics table'
    )
    parser.add_argument('owner', help='ukma-cs-ssdm-2025')
    parser.add_argument('repo', help='team-bottleneck')
    parser.add_argument('--token', help='your token')
    parser.add_argument('--limit', type=int, default=200, help="100")
    parser.add_argument('--output', default=FILE_PATH, help=FILE_PATH)
    
    args = parser.parse_args()
    
    print(f"🔍 Fetching workflow runs for {args.owner}/{args.repo}...")
    
    try:
        all_runs, runs_by_commit = get_all_runs_optimized(
            args.owner, 
            args.repo, 
            token=args.token,
            limit=args.limit
        )
        
        runs_to_process = all_runs[:args.limit]
        print(f"📊 Processing {len(runs_to_process)} runs")
        
        table = generate_markdown_table(runs_to_process, runs_by_commit)
        update_metrics_file(table, args.output)
        
        print(f"✅ Done! Check {args.output}")
        
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        if e.response.status_code == 401:
            print("💡 Tip: You may need to provide a GitHub token with --token")
        elif e.response.status_code == 403:
            print("💡 Tip: Rate limit exceeded. Use --token to increase limit")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
if __name__ == '__main__':
    main()