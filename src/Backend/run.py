from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps
import uuid

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB setup
# MongoDB setup
client = MongoClient(os.environ.get('MONGODB_URI', 'mongodb://localhost:27017'))
db = client['learning_assistant']

# Collections
users_collection = db.users
courses_collection = db.courses
lessons_collection = db.lessons
enrollments_collection = db.enrollments
progress_collection = db.progress
bookmarks_collection = db.bookmarks
sessions_collection = db.sessions
messages_collection = db.messages

# JWT Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
            
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.get('is_admin', False):
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validation
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if users_collection.find_one({'username': data['username']}):
        return jsonify({'error': 'Username already exists'}), 400
        
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already exists'}), 400
        
    hashed_password = generate_password_hash(data['password'])
    
    user = {
        'username': data['username'],
        'email': data['email'],
        'password': hashed_password,
        'is_admin': False,
        'points': 0,
        'streak': 0,
        'last_login': datetime.utcnow(),
        'created_at': datetime.utcnow()
    }
    
    user_id = users_collection.insert_one(user).inserted_id
    user['_id'] = str(user_id)
    
    # Generate token
    token = jwt.encode({
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=30)
    }, app.config['SECRET_KEY'])
    
    del user['password']
    
    return jsonify({
        'access_token': token,
        'user': user
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
        
    user = users_collection.find_one({'username': data['username']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Update last login and streak
    last_login = user.get('last_login', datetime.utcnow())
    today = datetime.utcnow().date()
    
    if last_login.date() == today - timedelta(days=1):
        new_streak = user.get('streak', 0) + 1
    elif last_login.date() == today:
        new_streak = user.get('streak', 0)
    else:
        new_streak = 1
        
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {
            'last_login': datetime.utcnow(),
            'streak': new_streak
        }}
    )
    
    # Generate token
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(days=30)
    }, app.config['SECRET_KEY'])
    
    user['_id'] = str(user['_id'])
    del user['password']
    
    return jsonify({
        'access_token': token,
        'user': user
    })

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    current_user['_id'] = str(current_user['_id'])
    if 'password' in current_user:
        del current_user['password']
    return jsonify(current_user)

# Courses Routes
@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = list(courses_collection.find({'is_published': True}))
    for course in courses:
        course['_id'] = str(course['_id'])
        course['lesson_count'] = lessons_collection.count_documents({'course_id': course['_id'], 'is_published': True})
    return jsonify(courses)

@app.route('/api/courses/featured', methods=['GET'])
def get_featured_courses():
    courses = list(courses_collection.find({'is_published': True, 'is_featured': True}).limit(3))
    for course in courses:
        course['_id'] = str(course['_id'])
        course['lesson_count'] = lessons_collection.count_documents({'course_id': course['_id'], 'is_published': True})
    return jsonify(courses)

@app.route('/api/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    course = courses_collection.find_one({'_id': ObjectId(course_id)})
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    course['_id'] = str(course['_id'])
    
    # Get lessons
    lessons = list(lessons_collection.find({'course_id': course_id, 'is_published': True}).sort('order', 1))
    for lesson in lessons:
        lesson['_id'] = str(lesson['_id'])
    
    course['lessons'] = lessons
    
    return jsonify(course)

@app.route('/api/courses/enroll/<course_id>', methods=['POST'])
@token_required
def enroll_course(current_user, course_id):
    # Check if course exists
    course = courses_collection.find_one({'_id': ObjectId(course_id)})
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    # Check if already enrolled
    enrollment = enrollments_collection.find_one({
        'user_id': str(current_user['_id']),
        'course_id': course_id
    })
    
    if enrollment:
        return jsonify({'error': 'Already enrolled in this course'}), 400
        
    # Create enrollment
    enrollments_collection.insert_one({
        'user_id': str(current_user['_id']),
        'course_id': course_id,
        'enrolled_at': datetime.utcnow(),
        'completed': False
    })
    
    return jsonify({'message': 'Successfully enrolled in course'}), 201

@app.route('/api/courses/<course_id>/enrollment', methods=['GET'])
@token_required
def check_enrollment(current_user, course_id):
    enrollment = enrollments_collection.find_one({
        'user_id': str(current_user['_id']),
        'course_id': course_id
    })
    
    return jsonify({'isEnrolled': bool(enrollment)})

# Lessons Routes
@app.route('/api/lessons/<lesson_id>', methods=['GET'])
@token_required
def get_lesson(current_user, lesson_id):
    lesson = lessons_collection.find_one({'_id': ObjectId(lesson_id)})
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
        
    lesson['_id'] = str(lesson['_id'])
    
    # Check if user is enrolled in the course
    enrollment = enrollments_collection.find_one({
        'user_id': str(current_user['_id']),
        'course_id': lesson['course_id']
    })
    
    if not enrollment and not lesson.get('is_free', False):
        return jsonify({'error': 'You need to enroll in this course first'}), 403
    
    return jsonify(lesson)

@app.route('/api/lessons/<lesson_id>/quiz', methods=['POST'])
@token_required
def submit_quiz(current_user, lesson_id):
    data = request.get_json()
    lesson = lessons_collection.find_one({'_id': ObjectId(lesson_id)})
    
    if not lesson or lesson['lesson_type'] != 'quiz':
        return jsonify({'error': 'Quiz not found'}), 404
        
    # Calculate score
    questions = lesson['content']['questions']
    correct = 0
    
    for i, question in enumerate(questions):
        user_answer = data.get('answers', {}).get(str(i), [])
        correct_answer = question['correct_answers']
        
        if set(user_answer) == set(correct_answer):
            correct += 1
    
    score = (correct / len(questions)) * 100
    
    # Update progress
    progress_collection.update_one(
        {
            'user_id': str(current_user['_id']),
            'course_id': lesson['course_id'],
            'lesson_id': lesson_id
        },
        {
            '$set': {
                'quiz_score': score,
                'progress': 1 if score >= 80 else 0.5,
                'completed': score >= 80,
                'updated_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Add points if completed
    if score >= 80:
        points = lesson.get('duration', 0) * 2
        users_collection.update_one(
            {'_id': current_user['_id']},
            {'$inc': {'points': points}}
        )
    
    return jsonify({
        'correct': correct,
        'total': len(questions),
        'score': score,
        'passed': score >= 80
    })

# Progress Routes
@app.route('/api/progress/<course_id>', methods=['GET'])
@token_required
def get_course_progress(current_user, course_id):
    lessons = list(lessons_collection.find({'course_id': course_id}))
    progress_items = list(progress_collection.find({
        'user_id': str(current_user['_id']),
        'course_id': course_id
    }))
    
    # Calculate overall progress
    total_lessons = len(lessons)
    if total_lessons == 0:
        return jsonify({'progress': 0, 'completedLessons': []})
    
    completed_lessons = []
    total_progress = 0
    
    for item in progress_items:
        if item.get('completed', False):
            completed_lessons.append(item['lesson_id'])
        total_progress += item.get('progress', 0)
    
    avg_progress = total_progress / total_lessons
    
    return jsonify({
        'progress': avg_progress,
        'completedLessons': completed_lessons
    })

@app.route('/api/progress/<course_id>/<lesson_id>', methods=['GET', 'POST'])
@token_required
def lesson_progress(current_user, course_id, lesson_id):
    if request.method == 'GET':
        progress = progress_collection.find_one({
            'user_id': str(current_user['_id']),
            'course_id': course_id,
            'lesson_id': lesson_id
        })
        
        if not progress:
            return jsonify({'progress': 0, 'completed': False})
            
        progress['_id'] = str(progress['_id'])
        return jsonify(progress)
        
    elif request.method == 'POST':
        data = request.get_json()
        
        progress_collection.update_one(
            {
                'user_id': str(current_user['_id']),
                'course_id': course_id,
                'lesson_id': lesson_id
            },
            {
                '$set': {
                    'progress': data.get('progress', 0),
                    'video_progress': data.get('video_progress'),
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return jsonify({'message': 'Progress updated'})

@app.route('/api/progress/<course_id>/<lesson_id>/complete', methods=['POST'])
@token_required
def complete_lesson(current_user, course_id, lesson_id):
    lesson = lessons_collection.find_one({'_id': ObjectId(lesson_id)})
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
        
    # Update progress
    progress_collection.update_one(
        {
            'user_id': str(current_user['_id']),
            'course_id': course_id,
            'lesson_id': lesson_id
        },
        {
            '$set': {
                'progress': 1,
                'completed': True,
                'updated_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Add points
    points = lesson.get('duration', 0) * 2
    users_collection.update_one(
        {'_id': current_user['_id']},
        {'$inc': {'points': points}}
    )
    
    return jsonify({'message': 'Lesson marked as completed', 'points': points})

# User Dashboard Routes
@app.route('/api/users/dashboard', methods=['GET'])
@token_required
def user_dashboard(current_user):
    # Get enrolled courses
    enrollments = list(enrollments_collection.find({'user_id': str(current_user['_id'])}))
    course_ids = [e['course_id'] for e in enrollments]
    
    courses = list(courses_collection.find({'_id': {'$in': [ObjectId(id) for id in course_ids]}}))
    for course in courses:
        course['_id'] = str(course['_id'])
        
    # Get progress for each course
    progress = {}
    for course_id in course_ids:
        progress[course_id] = get_course_progress(current_user, course_id).json
    
    return jsonify({
        'courses': courses,
        'progress': progress
    })

@app.route('/api/users/courses', methods=['GET'])
@token_required
def user_courses(current_user):
    enrollments = list(enrollments_collection.find({'user_id': str(current_user['_id'])}))
    course_ids = [e['course_id'] for e in enrollments]
    
    courses = list(courses_collection.find({'_id': {'$in': [ObjectId(id) for id in course_ids]}}))
    for course in courses:
        course['_id'] = str(course['_id'])
        
    return jsonify(courses)

@app.route('/api/users/progress', methods=['GET'])
@token_required
def user_progress(current_user):
    progress = list(progress_collection.find({'user_id': str(current_user['_id'])}))
    for p in progress:
        p['_id'] = str(p['_id'])
    return jsonify(progress)

@app.route('/api/users/stats', methods=['GET'])
@token_required
def user_stats(current_user):
    # Count enrolled courses
    enrolled_courses = enrollments_collection.count_documents({'user_id': str(current_user['_id'])})
    
    # Count completed courses
    completed_courses = 0
    enrollments = list(enrollments_collection.find({'user_id': str(current_user['_id'])}))
    
    for enrollment in enrollments:
        progress = get_course_progress(current_user, enrollment['course_id']).json
        if progress['progress'] >= 0.99:  # Consider 99% as completed
            completed_courses += 1
    
    return jsonify({
        'totalCourses': enrolled_courses,
        'completedCourses': completed_courses,
        'streak': current_user.get('streak', 0),
        'points': current_user.get('points', 0)
    })

# Bookmark Routes
@app.route('/api/bookmarks/<lesson_id>/check', methods=['GET'])
@token_required
def check_bookmark(current_user, lesson_id):
    bookmark = bookmarks_collection.find_one({
        'user_id': str(current_user['_id']),
        'lesson_id': lesson_id
    })
    
    return jsonify({'isBookmarked': bool(bookmark)})

@app.route('/api/bookmarks', methods=['POST'])
@token_required
def add_bookmark(current_user):
    data = request.get_json()
    lesson_id = data.get('lesson_id')
    
    if not lesson_id:
        return jsonify({'error': 'Lesson ID is required'}), 400
        
    # Check if lesson exists
    lesson = lessons_collection.find_one({'_id': ObjectId(lesson_id)})
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
        
    # Check if already bookmarked
    existing = bookmarks_collection.find_one({
        'user_id': str(current_user['_id']),
        'lesson_id': lesson_id
    })
    
    if existing:
        return jsonify({'error': 'Already bookmarked'}), 400
        
    # Add bookmark
    bookmarks_collection.insert_one({
        'user_id': str(current_user['_id']),
        'lesson_id': lesson_id,
        'created_at': datetime.utcnow()
    })
    
    return jsonify({'message': 'Bookmark added'}), 201

@app.route('/api/bookmarks/<lesson_id>', methods=['DELETE'])
@token_required
def remove_bookmark(current_user, lesson_id):
    result = bookmarks_collection.delete_one({
        'user_id': str(current_user['_id']),
        'lesson_id': lesson_id
    })
    
    if result.deleted_count == 0:
        return jsonify({'error': 'Bookmark not found'}), 404
        
    return jsonify({'message': 'Bookmark removed'})

# Admin Routes
@app.route('/api/admin/stats', methods=['GET'])
@token_required
@admin_required
def admin_stats(current_user):
    total_courses = courses_collection.count_documents({})
    total_users = users_collection.count_documents({})
    total_lessons = lessons_collection.count_documents({})
    
    # Calculate revenue (simplified)
    premium_enrollments = enrollments_collection.count_documents({'is_premium': True})
    revenue = premium_enrollments * 19.99  # Assuming $19.99 per premium enrollment
    
    return jsonify({
        'totalCourses': total_courses,
        'totalUsers': total_users,
        'totalLessons': total_lessons,
        'revenue': revenue
    })

@app.route('/api/admin/courses', methods=['GET', 'POST'])
@token_required
@admin_required
def admin_courses(current_user):
    if request.method == 'GET':
        courses = list(courses_collection.find())
        for course in courses:
            course['_id'] = str(course['_id'])
        return jsonify(courses)
        
    elif request.method == 'POST':
        data = request.form.to_dict()
        files = request.files
        
        # Handle thumbnail upload
        thumbnail_url = None
        if 'thumbnail' in files:
            thumbnail = files['thumbnail']
            filename = f"course_{datetime.now().timestamp()}.{thumbnail.filename.split('.')[-1]}"
            thumbnail.save(filename)
            thumbnail_url = filename
        
        course = {
            'title': data.get('title'),
            'description': data.get('description'),
            'category': data.get('category', 'Language'),
            'difficulty': data.get('difficulty', 'Beginner'),
            'is_published': data.get('is_published', 'false') == 'true',
            'thumbnail': thumbnail_url,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        course_id = courses_collection.insert_one(course).inserted_id
        course['_id'] = str(course_id)
        
        return jsonify(course), 201

@app.route('/api/admin/courses/recent', methods=['GET'])
@token_required
@admin_required
def admin_recent_courses(current_user):
    courses = list(courses_collection.find().sort('created_at', -1).limit(5))
    for course in courses:
        course['_id'] = str(course['_id'])
    return jsonify(courses)

@app.route('/api/admin/courses/<course_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
@admin_required
def admin_course(current_user, course_id):
    if request.method == 'GET':
        course = courses_collection.find_one({'_id': ObjectId(course_id)})
        if not course:
            return jsonify({'error': 'Course not found'}), 404
            
        course['_id'] = str(course['_id'])
        return jsonify(course)
        
    elif request.method == 'PUT':
        data = request.form.to_dict()
        files = request.files
        
        updates = {
            'title': data.get('title'),
            'description': data.get('description'),
            'category': data.get('category'),
            'difficulty': data.get('difficulty'),
            'is_published': data.get('is_published') == 'true',
            'updated_at': datetime.utcnow()
        }
        
        # Handle thumbnail upload
        if 'thumbnail' in files:
            thumbnail = files['thumbnail']
            filename = f"course_{datetime.now().timestamp()}.{thumbnail.filename.split('.')[-1]}"
            thumbnail.save(filename)
            updates['thumbnail'] = filename
        
        result = courses_collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': updates}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400
            
        return jsonify({'message': 'Course updated'})
        
    elif request.method == 'DELETE':
        # Delete associated lessons first
        lessons_collection.delete_many({'course_id': course_id})
        
        # Delete course
        result = courses_collection.delete_one({'_id': ObjectId(course_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Course not found'}), 404
            
        return jsonify({'message': 'Course deleted'})

@app.route('/api/admin/courses/<course_id>/lessons', methods=['GET', 'POST'])
@token_required
@admin_required
def admin_lessons(current_user, course_id):
    if request.method == 'GET':
        lessons = list(lessons_collection.find({'course_id': course_id}).sort('order', 1))
        for lesson in lessons:
            lesson['_id'] = str(lesson['_id'])
        return jsonify(lessons)
        
    elif request.method == 'POST':
        data = request.get_json()
        
        lesson = {
            'course_id': course_id,
            'title': data.get('title'),
            'description': data.get('description'),
            'lesson_type': data.get('lesson_type', 'text'),
            'content': data.get('content', {}),
            'duration': int(data.get('duration', 0)),
            'is_free': data.get('is_free', True),
            'order': int(data.get('order', 0)),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        lesson_id = lessons_collection.insert_one(lesson).inserted_id
        lesson['_id'] = str(lesson_id)
        
        return jsonify(lesson), 201

@app.route('/api/admin/lessons/<lesson_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
@admin_required
def admin_lesson(current_user, lesson_id):
    if request.method == 'GET':
        lesson = lessons_collection.find_one({'_id': ObjectId(lesson_id)})
        if not lesson:
            return jsonify({'error': 'Lesson not found'}), 404
            
        lesson['_id'] = str(lesson['_id'])
        return jsonify(lesson)
        
    elif request.method == 'PUT':
        data = request.get_json()
        
        updates = {
            'title': data.get('title'),
            'description': data.get('description'),
            'lesson_type': data.get('lesson_type'),
            'content': data.get('content'),
            'duration': int(data.get('duration', 0)),
            'is_free': data.get('is_free', True),
            'order': int(data.get('order', 0)),
            'updated_at': datetime.utcnow()
        }
        
        result = lessons_collection.update_one(
            {'_id': ObjectId(lesson_id)},
            {'$set': updates}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400
            
        return jsonify({'message': 'Lesson updated'})
        
    elif request.method == 'DELETE':
        result = lessons_collection.delete_one({'_id': ObjectId(lesson_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Lesson not found'}), 404
            
        return jsonify({'message': 'Lesson deleted'})

@app.route('/api/admin/users/recent', methods=['GET'])
@token_required
@admin_required
def admin_recent_users(current_user):
    users = list(users_collection.find().sort('created_at', -1).limit(5))
    for user in users:
        user['_id'] = str(user['_id'])
        if 'password' in user:
            del user['password']
    return jsonify(users)

# Assistant Routes
@app.route('/api/assistant/session', methods=['POST'])
@token_required
def start_assistant_session(current_user):
    data = request.get_json()
    course_id = data.get('course_id')
    
    session_id = str(uuid.uuid4())
    
    sessions_collection.insert_one({
        'session_id': session_id,
        'user_id': str(current_user['_id']),
        'course_id': course_id,
        'created_at': datetime.utcnow(),
        'active': True
    })
    
    # Load previous messages if any
    messages = list(messages_collection.find({
        'session_id': session_id
    }).sort('timestamp', 1))
    
    for message in messages:
        message['_id'] = str(message['_id'])
    
    return jsonify({
        'session_id': session_id,
        'messages': messages
    })

@app.route('/api/assistant/message', methods=['POST'])
@token_required
def send_assistant_message(current_user):
    data = request.get_json()
    session_id = data.get('session_id')
    message = data.get('message')
    
    if not session_id or not message:
        return jsonify({'error': 'Missing session_id or message'}), 400
        
    # Save user message
    user_message = {
        'session_id': session_id,
        'sender': 'user',
        'content': message,
        'timestamp': datetime.utcnow()
    }
    
    messages_collection.insert_one(user_message)
    
    # Here you would typically send the message to your AI assistant
    # For now, we'll just echo back
    assistant_message = {
        'session_id': session_id,
        'sender': 'assistant',
        'content': f"I received your message: {message}",
        'timestamp': datetime.utcnow()
    }
    
    messages_collection.insert_one(assistant_message)
    
    # Emit the message via Socket.IO
    socketio.emit('assistant_message', assistant_message, room=session_id)
    
    return jsonify({'message': 'Message sent'})

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_session')
def handle_join_session(data):
    session_id = data.get('session_id')
    if session_id:
        join_room(session_id)
        print(f"User joined session {session_id}")

if __name__ == '__main__':
    socketio.run(app, debug=True)