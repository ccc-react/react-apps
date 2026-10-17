use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
struct Post {
    id: String,
    title: String,
    content: String,
    image: String,
    author: String,
    likes: u32,
    tags: Vec<String>,
}

#[derive(Deserialize)]
struct CreatePost {
    title: String,
    content: String,
    image: Option<String>,
    author: String,
    tags: Option<Vec<String>>,
}

type Db = Arc<RwLock<Vec<Post>>>;

fn seed() -> Vec<Post> {
    vec![
        Post {
            id: Uuid::new_v4().to_string(),
            title: "週末咖啡廳探店 ☕".into(),
            content: "隱藏在巷子裡的小咖啡廳，拿鐵超好喝，裝潢也很溫馨，推薦給大家！".into(),
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600".into(),
            author: "小花".into(),
            likes: 128,
            tags: vec!["咖啡".into(), "探店".into()],
        },
        Post {
            id: Uuid::new_v4().to_string(),
            title: "秋日穿搭分享 🍂".into(),
            content: "簡約的米色系穿搭，大衣＋圍巾就是秋天的標配！".into(),
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600".into(),
            author: "阿哲".into(),
            likes: 96,
            tags: vec!["穿搭".into(), "ootd".into()],
        },
        Post {
            id: Uuid::new_v4().to_string(),
            title: "居家烘焙：巴斯克乳酪蛋糕 🍰".into(),
            content: "新手也能成功的配方，烤完表面焦焦的超香，做法超簡單！".into(),
            image: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=600".into(),
            author: "甜點妹".into(),
            likes: 210,
            tags: vec!["烘焙".into(), "食譜".into()],
        },
        Post {
            id: Uuid::new_v4().to_string(),
            title: "陽明山夜景攻略 🌃".into(),
            content: "下班後衝上山看夜景，整個台北市盡收眼底，療癒程度爆表！".into(),
            image: "https://images.unsplash.com/photo-1502920514313-52581002a659?w=600".into(),
            author: "旅人K".into(),
            likes: 175,
            tags: vec!["旅遊".into(), "夜景".into()],
        },
        Post {
            id: Uuid::new_v4().to_string(),
            title: "我的極簡書桌改造 📝".into(),
            content: "用了白色系收納，桌面終於不再亂糟糟，工作心情都變好了。".into(),
            image: "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=600".into(),
            author: "極簡主義者".into(),
            likes: 88,
            tags: vec!["居家".into(), "收納".into()],
        },
        Post {
            id: Uuid::new_v4().to_string(),
            title: "貓咪日常：主子翻肚肚 🐱".into(),
            content: "第一次被主子翻肚肚！表示信任嗎？還是陷阱？".into(),
            image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600".into(),
            author: "貓奴日記".into(),
            likes: 342,
            tags: vec!["寵物".into(), "貓".into()],
        },
    ]
}

async fn list_posts(State(db): State<Db>) -> Json<Vec<Post>> {
    Json(db.read().await.clone())
}

async fn get_post(Path(id): Path<String>, State(db): State<Db>) -> Result<Json<Post>, StatusCode> {
    db.read()
        .await
        .iter()
        .find(|p| p.id == id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn like_post(Path(id): Path<String>, State(db): State<Db>) -> Result<Json<Post>, StatusCode> {
    let mut db = db.write().await;
    if let Some(p) = db.iter_mut().find(|p| p.id == id) {
        p.likes += 1;
        return Ok(Json(p.clone()));
    }
    Err(StatusCode::NOT_FOUND)
}

async fn create_post(
    State(db): State<Db>,
    Json(input): Json<CreatePost>,
) -> Json<Post> {
    let post = Post {
        id: Uuid::new_v4().to_string(),
        title: input.title,
        content: input.content,
        image: input.image.unwrap_or_else(|| {
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600".into()
        }),
        author: input.author,
        likes: 0,
        tags: input.tags.unwrap_or_default(),
    };
    db.write().await.insert(0, post.clone());
    Json(post)
}

#[tokio::main]
async fn main() {
    let db: Db = Arc::new(RwLock::new(seed()));

    let app = Router::new()
        .route("/api/posts", get(list_posts).post(create_post))
        .route("/api/posts/{id}", get(get_post))
        .route("/api/posts/{id}/like", post(like_post))
        .layer(CorsLayer::very_permissive())
        .fallback_service(ServeDir::new("../app/dist").append_index_html_on_directories(true))
        .with_state(db);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("yourbook server running at http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
