import { Link } from "react-router-dom";
import HeaderComponent from "../components/header";
import Post from "../components/post";
import { useEffect, useRef, useState } from "react";
import PostService from "../services/postService";
import { Drawer } from "vaul";
import { useAppContext } from "../app-context";
import { RotatingLines } from "react-loader-spinner";
import { toast } from "sonner";

enum PostQuerySortEnum {
  REC = "rec",
  TOP = "top",
  RAND = "rand",
}

enum QuerySortOrderEnum {
  ACS = "acs",
  DESC = "desc",
}

export default function FeedsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [query, setQuery] = useState<PostQueryParams>({
    page: 1,
    limit: 10,
    sort: PostQuerySortEnum.REC,
    order: QuerySortOrderEnum.DESC,
    since: null,
    topic: null,
    author: null,
  });
  const [openFilterDrawer, setFilterDrawer] = useState(false);
  const [openSortDrawer, setSortDrawer] = useState(false);
  const [filterTitle, setFilterTitle] = useState("Recent posts");
  const { authUser } = useAppContext();
  const lockInfinityLoad = useRef(false);

  const getPosts = async (_query?: PostQueryParams) => {
    setLoading(true);
    const posts = (await PostService.getMany(_query || query)).data.data.docs;
    setPosts(posts);
    setHasMoreData(true)
    setLoading(false);
    setTimeout(() => scrollToTop(), 0);
  };

  const updateQueryAndReloadPosts = async (data: Partial<PostQueryParams>) => {
    const key = Object.keys(data)[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    query[key] = data[key];
    query.page = 1;
    setQuery(query);
    setPage(1)
    setFilterDrawer(false);
    setSortDrawer(false);
    await getPosts(query);

    if (key == "sort") {
      switch (data[key]) {
        case "rec":
          setFilterTitle("Recent posts");
          break;
        case "top":
          setFilterTitle("Top posts");
          break;
        case "rand":
          setFilterTitle("Random posts");
          break;
        default:
          break;
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    //  window.scrollTo(0,0);
  };

  useEffect(() => {
    (async () => {
      await getPosts();
    })();
  }, [authUser]);

  useEffect(() => {
    lockInfinityLoad.current = true;
    const infinityGetPost = async () => {
      if (!hasMoreData || page < 2) {
        lockInfinityLoad.current = false;
        return;
      } // Prevent unnecessary fetches

      setLoading(true);
      try {
        query.page = page;
        const posts = (await PostService.getMany(query)).data.data.docs;
        setPosts((prevPosts) => [...prevPosts, ...posts]); // Append new data
        setHasMoreData(posts.length > 0); // Update flag based on response
      } catch (error) {
        toast.error("Error fetching posts");
      } finally {
        lockInfinityLoad.current = false;
        setLoading(false);
      }
    };
    (async () => {
      await infinityGetPost();
    })();
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >
          document.documentElement.offsetHeight - 200 &&
        !lockInfinityLoad.current
      ) {
        setPage((prevPage) => prevPage + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Link to="/create-post">
        <div id="fab">
          <svg
            width="51"
            height="51"
            viewBox="0 0 51 51"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.18335"
              y="0.865234"
              width="50"
              height="50"
              rx="25"
              fill="#3C008F"
            />
            <path
              d="M24.5834 32.026L31.9794 24.63C30.735 24.1104 29.6049 23.3514 28.6534 22.396C27.6975 21.4442 26.9381 20.3137 26.4184 19.069L19.0224 26.465C18.4454 27.042 18.1564 27.331 17.9084 27.649C17.6155 28.0242 17.3643 28.4303 17.1594 28.86C16.9864 29.224 16.8574 29.612 16.5994 30.386L15.2374 34.469C15.1747 34.6559 15.1654 34.8566 15.2105 35.0486C15.2556 35.2405 15.3534 35.4161 15.4928 35.5555C15.6323 35.6949 15.8078 35.7927 15.9998 35.8378C16.1917 35.8829 16.3924 35.8736 16.5794 35.811L20.6624 34.449C21.4374 34.191 21.8244 34.062 22.1884 33.889C22.6184 33.684 23.0244 33.433 23.3994 33.14C23.7174 32.892 24.0064 32.603 24.5834 32.026ZM34.0314 22.578C34.7688 21.8405 35.1831 20.8403 35.1831 19.7975C35.1831 18.7546 34.7688 17.7544 34.0314 17.017C33.2939 16.2795 32.2938 15.8652 31.2509 15.8652C30.208 15.8652 29.2078 16.2795 28.4704 17.017L27.5834 17.904L27.6214 18.015C28.0585 19.2657 28.7738 20.4009 29.7134 21.335C30.6754 22.3027 31.8503 23.0321 33.1444 23.465L34.0314 22.578Z"
              fill="white"
            />
          </svg>
        </div>
      </Link>

      <HeaderComponent />

      <div id="filter-bar">
        <div className="fb-l" onClick={() => setFilterDrawer(true)}>
          <div>
            <span className="fb-l-title">{filterTitle}</span>
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.18335 6.38586L8.18335 10.3859L12.1833 6.38586"
                stroke="#292A31"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="fb-r" onClick={() => setSortDrawer(true)}>
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.23533 4.40076C7.67584 4.40076 7.22229 4.85431 7.22229 5.4138V6.45661H6.1673C5.07159 6.45661 4.18335 7.34485 4.18335 8.44055V18.387C4.18335 19.4827 5.07159 20.3709 6.1673 20.3709H18.1994C19.2951 20.3709 20.1833 19.4827 20.1833 18.387V8.44055C20.1833 7.34485 19.2951 6.45661 18.1994 6.45661H17.1739V5.4138C17.1739 4.85431 16.7203 4.40076 16.1608 4.40076C15.6013 4.40076 15.1478 4.85431 15.1478 5.4138V6.45661H9.24837V5.4138C9.24837 4.85431 8.79482 4.40076 8.23533 4.40076ZM17.4123 10.4194C17.4123 9.85989 16.9588 9.40633 16.3993 9.40633L7.96729 9.40633C7.4078 9.40633 6.95425 9.85988 6.95425 10.4194C6.95425 10.9789 7.4078 11.4324 7.96729 11.4324L16.3993 11.4324C16.9588 11.4324 17.4123 10.9789 17.4123 10.4194Z"
              fill="black"
            />
          </svg>
        </div>
      </div>

      <div id="loader-container">
        {loading && (
          <div className="post-loader">
            <RotatingLines
              visible={true}
              width="2rem"
              strokeColor="grey"
              strokeWidth="5"
              animationDuration="0.75"
              ariaLabel="rotating-lines-loading"
            />
          </div>
        )}

        {posts.length < 1 && !loading && (
          <div className="no-post">No Posts</div>
        )}
      </div>

      <main id="posts">
        {posts.map((data: Post) => {
          return (
            <Post
              key={data._id}
              id={data._id}
              address={data.author.address}
              tag={data.topic.title}
              caption={data.caption}
              createdAt={data.created_at}
              upvotes={data.upvotes}
              upvoted={data.upvoted}
              downvoted={data.downvoted}
              tiktok={data.tiktok}
              mediaUrl={data.media_url}
            />
          );
        })}
      </main>

      {loading && (
        <div className="infinity-loader">
          <RotatingLines
            visible={true}
            width="2rem"
            strokeColor="grey"
            strokeWidth="5"
            animationDuration="0.75"
            ariaLabel="rotating-lines-loading"
          />
        </div>
      )}

      <Drawer.Root open={openFilterDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-cont">
            <Drawer.Title className="drawer-header">
              <div
                className="drawer-close"
                onClick={() => setFilterDrawer(false)}
              >
                <svg
                  width="31"
                  height="31"
                  viewBox="0 0 31 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="15.1693" cy="15.2343" r="15" fill="#F1F2F4" />
                  <path
                    d="M19.1693 11.2343L11.1693 19.2343"
                    stroke="#9696A0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.1693 11.2343L19.1693 19.2343"
                    stroke="#9696A0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Drawer.Title>
            <ul className="drawer-list">
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ sort: PostQuerySortEnum.REC });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Recent</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ sort: PostQuerySortEnum.TOP });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M24.4662 17.2092L19.4078 12.1509L14.3495 17.2092"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19.4078 26.3176V12.2926"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Top Posts</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ sort: PostQuerySortEnum.RAND });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M27.6917 22.4714C27.6757 22.3496 27.624 22.2353 27.5429 22.1429L27.5119 22.1119L25.6527 20.2527C25.536 20.136 25.3777 20.0704 25.2127 20.0704C25.0476 20.0704 24.8894 20.136 24.7727 20.2527C24.656 20.3694 24.5904 20.5277 24.5904 20.6927C24.5904 20.8578 24.656 21.016 24.7727 21.1327L25.5783 21.9322H22.7337C21.9118 21.9322 21.1237 21.6057 20.5425 21.0246C19.9614 20.4435 19.6349 19.6553 19.6349 18.8335C19.6349 18.0116 19.9614 17.2235 20.5425 16.6423C21.1237 16.0612 21.9118 15.7347 22.7337 15.7347H25.5783L24.7727 16.5342C24.7149 16.592 24.669 16.6606 24.6378 16.7361C24.6065 16.8116 24.5904 16.8925 24.5904 16.9742C24.5904 17.1393 24.656 17.2976 24.7727 17.4143C24.8894 17.531 25.0476 17.5965 25.2127 17.5965C25.2944 17.5965 25.3753 17.5804 25.4508 17.5491C25.5263 17.5179 25.5949 17.472 25.6527 17.4143L27.5119 15.555C27.562 15.5006 27.6018 15.4376 27.6297 15.3691C27.6332 15.3486 27.6332 15.3276 27.6297 15.3071C27.6362 15.2557 27.6362 15.2036 27.6297 15.1522V15.115C27.6294 15.0492 27.6168 14.984 27.5925 14.9229C27.5668 14.8533 27.5267 14.7899 27.4748 14.7369L25.6155 12.8777C25.5577 12.8199 25.4891 12.7741 25.4136 12.7428C25.3381 12.7115 25.2572 12.6954 25.1755 12.6954C25.0938 12.6954 25.0129 12.7115 24.9374 12.7428C24.8619 12.7741 24.7933 12.8199 24.7355 12.8777C24.6777 12.9355 24.6318 13.0041 24.6006 13.0796C24.5693 13.1551 24.5532 13.236 24.5532 13.3177C24.5532 13.3994 24.5693 13.4804 24.6006 13.5559C24.6318 13.6314 24.6777 13.7 24.7355 13.7577L25.5783 14.4952H22.7337C21.8772 14.4955 21.04 14.7494 20.3275 15.2247C19.6151 15.7 19.0592 16.3756 18.7301 17.1664C18.401 16.3756 17.8452 15.7 17.1327 15.2247C16.4202 14.7494 15.583 14.4955 14.7265 14.4952H11.0081C10.8437 14.4952 10.6861 14.5605 10.5698 14.6768C10.4536 14.793 10.3883 14.9506 10.3883 15.115C10.3883 15.2794 10.4536 15.437 10.5698 15.5532C10.6861 15.6694 10.8437 15.7347 11.0081 15.7347H14.7265C15.5484 15.7347 16.3366 16.0612 16.9177 16.6423C17.4988 17.2235 17.8253 18.0116 17.8253 18.8335C17.8253 19.6553 17.4988 20.4435 16.9177 21.0246C16.3366 21.6057 15.5484 21.9322 14.7265 21.9322H11.0081C10.8437 21.9322 10.6861 21.9975 10.5698 22.1137C10.4536 22.23 10.3883 22.3876 10.3883 22.552C10.3883 22.7163 10.4536 22.874 10.5698 22.9902C10.6861 23.1064 10.8437 23.1717 11.0081 23.1717H14.7265C15.583 23.1714 16.4202 22.9176 17.1327 22.4422C17.8452 21.9669 18.401 21.2913 18.7301 20.5006C19.0592 21.2913 19.6151 21.9669 20.3275 22.4422C21.04 22.9176 21.8772 23.1714 22.7337 23.1717H25.5783L24.7727 23.9712C24.656 24.0879 24.5904 24.2462 24.5904 24.4112C24.5904 24.5762 24.656 24.7345 24.7727 24.8512C24.8894 24.9679 25.0476 25.0335 25.2127 25.0335C25.3777 25.0335 25.536 24.9679 25.6527 24.8512L27.5119 22.992C27.6142 22.8865 27.6757 22.7481 27.6855 22.6015C27.6886 22.5603 27.6886 22.5189 27.6855 22.4776L27.6917 22.4714Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Random</span>
              </li>
            </ul>
          </Drawer.Content>
          <Drawer.Overlay />
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={openSortDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-cont">
            <Drawer.Title className="drawer-header">
              <div
                className="drawer-close"
                onClick={() => setSortDrawer(false)}
              >
                <svg
                  width="31"
                  height="31"
                  viewBox="0 0 31 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="15.1693" cy="15.2343" r="15" fill="#F1F2F4" />
                  <path
                    d="M19.1693 11.2343L11.1693 19.2343"
                    stroke="#9696A0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.1693 11.2343L19.1693 19.2343"
                    stroke="#9696A0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Drawer.Title>
            <ul className="drawer-list">
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ since: "1h" });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Last 1h</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ since: "6h" });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Last 6h</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ since: "24h" });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Last 24h</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ since: "7d" });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">Last 7d</span>
              </li>
              <li
                className="drawer-listitem"
                onClick={async () => {
                  updateQueryAndReloadPosts({ since: null });
                }}
              >
                <span className="drawer-listitem-icon">
                  <svg
                    width="39"
                    height="39"
                    viewBox="0 0 39 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.407837"
                      y="0.234253"
                      width="38"
                      height="38"
                      rx="19"
                      fill="#F4F8FB"
                    />
                    <path
                      d="M19.2026 10.7467C17.8157 10.7489 16.4534 11.1133 15.2506 11.8039C14.0478 12.4944 13.0462 13.4871 12.345 14.6838V13.167C12.345 12.9531 12.26 12.7479 12.1087 12.5966C11.9574 12.4453 11.7522 12.3603 11.5382 12.3603C11.3243 12.3603 11.119 12.4453 10.9677 12.5966C10.8164 12.7479 10.7314 12.9531 10.7314 13.167V16.3941C10.7314 16.6081 10.8164 16.8133 10.9677 16.9646C11.119 17.1159 11.3243 17.2009 11.5382 17.2009H15.1687C15.3827 17.2009 15.5879 17.1159 15.7392 16.9646C15.8905 16.8133 15.9755 16.6081 15.9755 16.3941C15.9755 16.1802 15.8905 15.975 15.7392 15.8237C15.5879 15.6724 15.3827 15.5874 15.1687 15.5874H13.6842C14.2365 14.6095 15.0382 13.7956 16.0076 13.2287C16.9771 12.6617 18.0795 12.3621 19.2026 12.3603C20.3861 12.3586 21.5473 12.6824 22.5592 13.2962C23.5711 13.9101 24.3947 14.7903 24.94 15.8407C25.4853 16.8912 25.7313 18.0713 25.651 19.2521C25.5708 20.4329 25.1674 21.5689 24.485 22.5359C23.8026 23.5029 22.8674 24.2636 21.7818 24.7349C20.6961 25.2062 19.5018 25.3699 18.3294 25.2081C17.1569 25.0463 16.0516 24.5652 15.1342 23.8175C14.2167 23.0698 13.5226 22.0842 13.1276 20.9685C13.057 20.7663 12.9089 20.6005 12.716 20.5074C12.5231 20.4144 12.3011 20.4018 12.0989 20.4724C11.8967 20.543 11.7309 20.691 11.6378 20.8839C11.5448 21.0768 11.5322 21.2988 11.6028 21.501C12.0954 22.8961 12.9623 24.1288 14.1084 25.0644C15.2546 26 16.6359 26.6024 18.1014 26.8057C19.5669 27.009 21.0601 26.8054 22.4176 26.2172C23.7752 25.6289 24.9448 24.6787 25.7987 23.4705C26.6525 22.2622 27.1577 20.8424 27.2589 19.3664C27.3601 17.8903 27.0535 16.4149 26.3726 15.1014C25.6916 13.7878 24.6626 12.6869 23.3981 11.9189C22.1335 11.1508 20.6821 10.7453 19.2026 10.7467Z"
                      fill="black"
                    />
                    <path
                      d="M22.228 22.0416C22.0534 22.0416 21.8836 21.9849 21.7439 21.8802L18.5168 19.4599C18.4166 19.3847 18.3353 19.2873 18.2793 19.1753C18.2233 19.0632 18.1941 18.9397 18.1941 18.8145V15.5874C18.1941 15.3734 18.2791 15.1682 18.4304 15.0169C18.5817 14.8656 18.7869 14.7806 19.0009 14.7806C19.2148 14.7806 19.42 14.8656 19.5713 15.0169C19.7226 15.1682 19.8076 15.3734 19.8076 15.5874V18.4111L22.712 20.5894C22.7968 20.6529 22.8682 20.7326 22.9222 20.8237C22.9762 20.9149 23.0117 21.0158 23.0266 21.1207C23.0416 21.2256 23.0358 21.3324 23.0095 21.435C22.9832 21.5376 22.937 21.6341 22.8734 21.7188C22.7982 21.819 22.7008 21.9004 22.5888 21.9564C22.4767 22.0124 22.3532 22.0416 22.228 22.0416Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="drawer-listitem-title">All time</span>
              </li>
            </ul>
          </Drawer.Content>
          <Drawer.Overlay />
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
