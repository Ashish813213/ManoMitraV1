#!/usr/bin/env python
"""
ManoMITRA NLP Service Startup Script
Sets up and runs the NLP and chat generation service
"""

import os
import sys
import subprocess
import argparse
import importlib.util
from pathlib import Path


def check_dependencies():
    """Check if all required packages are installed"""
    print("Checking dependencies...")
    
    required = [
        'flask',
        'flask_cors',
        'nltk',
        'transformers',
        'torch',
        'pymongo',
        'numpy',
        'requests',
        'python-dotenv'
    ]
    module_map = {
        'python-dotenv': 'dotenv'
    }
    
    missing = []
    for package in required:
        module_name = module_map.get(package, package.replace('-', '_'))
        try:
            if importlib.util.find_spec(module_name) is None:
                raise ImportError(module_name)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package}")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print(f"Run: pip install {' '.join(missing)}")
        return False
    
    print("\n✓ All dependencies installed\n")
    return True


def download_nltk_data():
    """Download required NLTK data"""
    print("Checking NLTK data...")
    
    import nltk
    
    datasets = ['punkt', 'stopwords']
    
    for dataset in datasets:
        try:
            nltk.data.find(f'tokenizers/{dataset}' if dataset == 'punkt' else f'corpora/{dataset}')
            print(f"  ✓ {dataset}")
        except LookupError:
            print(f"  Downloading {dataset}...")
            nltk.download(dataset)
    
    print()


def start_service(port: int = 5001, debug: bool = True):
    """Start the NLP service"""
    
    if not check_dependencies():
        print("❌ Please install missing dependencies first")
        sys.exit(1)
    
    download_nltk_data()
    
    print(f"🚀 Starting ManoMITRA NLP Service on port {port}")
    print(f"   Debug: {'ON' if debug else 'OFF'}")
    print(f"   URL: http://localhost:{port}")
    print(f"   Health: http://localhost:{port}/health")
    print(f"\n   Available Endpoints:")
    print(f"   - POST /analyze  (sentiment + emotion + safety)")
    print(f"   - POST /chat     (AI chat generation)")
    print(f"   - POST /sentiment")
    print(f"   - POST /emotion")
    print(f"   - POST /safety")
    print(f"\n   Ctrl+C to stop\n")
    
    # Set environment variables
    os.environ['NLP_PORT'] = str(port)
    os.environ['NODE_ENV'] = 'development' if debug else 'production'
    
    # Start server
    try:
        from main import app
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug,
            use_reloader=debug
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Service stopped")


def run_tests():
    """Run test suite"""
    print("Running NLP Service Tests...\n")
    
    try:
        import test_nlp_service
        test_nlp_service.test_service()
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)


def main():
    """Main entry point"""
    
    parser = argparse.ArgumentParser(
        description='ManoMITRA NLP and Chat Generation Service'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=5001,
        help='Port to run service on (default: 5001)'
    )
    parser.add_argument(
        '--production',
        action='store_true',
        help='Run in production mode (no debug)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run test suite'
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='Check dependencies only'
    )
    
    args = parser.parse_args()
    
    if args.check:
        check_dependencies()
        download_nltk_data()
        print("✓ All checks passed")
        sys.exit(0)
    
    if args.test:
        run_tests()
        sys.exit(0)
    
    # Start service
    debug = not args.production
    start_service(port=args.port, debug=debug)


if __name__ == '__main__':
    main()
